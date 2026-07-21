import React, { useState, useEffect } from 'react';
import { MapPin, Users } from 'lucide-react';
// @ts-ignore
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
// @ts-ignore
import { scaleLinear } from 'd3-scale';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  fondo: '#f5f7f8',
  mapaVacio: '#f1f5f9',     // Gris muy clarito para comunas de V Región con 0 trabajadores
  regionExterna: '#cbd5e1', // Gris oscuro sólido para fundir las otras regiones
  mar: '#dbeafe'            // Azul suave para el océano
};

const geoUrl = "./comunas.json";

const COMUNAS_V_REGION = [
  "valparaiso", "vina del mar", "quilpue", "villa alemana", "concon",
  "puchuncavi", "quintero", "casablanca", "san antonio", "cartagena", 
  "el tabo", "el quisco", "algarrobo", "santo domingo", "quillota", 
  "la cruz", "la calera", "nogales", "hijuelas", "limache", "olmue",
  "san felipe", "panquehue", "catemu", "putaendo", "santa maria", "llai llay",
  "los andes", "san esteban", "calle larga", "rinconada", "petorca", 
  "cabildo", "zapallar", "papudo", "la ligua"
];

interface ComunasProps {
  rawData: any[];
}

export default function ComunasTab({ rawData }: ComunasProps) {
  const [comunasData, setComunasData] = useState<Record<string, number>>({});
  const [ranking, setRanking] = useState<any[]>([]);
  const [maxCount, setMaxCount] = useState(0);
  const [tooltip, setTooltip] = useState("");
  
  const [geoData, setGeoData] = useState<any>(null);
  const [mapStatus, setMapStatus] = useState<string>("Cargando archivo del mapa...");

  const normalizarComuna = (name: string) => {
    let n = String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    
    if (n === "con con") return "concon";
    if (n === "calera") return "la calera";
    if (n === "cruz") return "la cruz";
    if (n === "ligua") return "la ligua";
    if (n === "llay llay" || n === "llaillay" || n === "llay-llay") return "llai llay";
    if (n === "vina") return "vina del mar";
    if (n === "valpo") return "valparaiso";
    
    return n;
  };

  useEffect(() => {
    const counts: Record<string, number> = {};
    let max = 0;

    if (!rawData || rawData.length === 0) return;

    rawData.forEach((row: any) => {
      let comunaValor = '';
      const llaveEncontrada = Object.keys(row).find(k => k.toLowerCase().includes('comuna'));
      
      if (llaveEncontrada) {
        comunaValor = String(row[llaveEncontrada]).trim();
      }

      if (comunaValor) {
        const cleaned = normalizarComuna(comunaValor);
        if (COMUNAS_V_REGION.includes(cleaned)) {
          counts[cleaned] = (counts[cleaned] || 0) + 1;
          if (counts[cleaned] > max) max = counts[cleaned];
        }
      }
    });

    const rankArray = Object.keys(counts)
      .map(key => ({ comuna: key, count: counts[key] }))
      .sort((a, b) => b.count - a.count);

    setComunasData(counts);
    setMaxCount(max);
    setRanking(rankArray);
  }, [rawData]);

  useEffect(() => {
    fetch(geoUrl)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP Error ${res.status}: No se encontró comunas.json`);
        const texto = await res.text();
        if (texto.trim().startsWith('<')) throw new Error("Error: Archivo HTML en lugar de JSON.");
        return JSON.parse(texto);
      })
      .then(data => {
        setGeoData(data);
        setMapStatus(""); 
      })
      .catch(err => {
        setMapStatus(err.message); 
      });
  }, []);

  const colorScale = scaleLinear()
    .domain([0, maxCount === 0 ? 1 : maxCount])
    .range(["#e8f4f5", COLORS.naranjo]); // De celeste muy pálido a Naranjo Codelco

  const getComunaName = (properties: any) => {
    const possibleKeys = Object.keys(properties).filter(k => 
      k.toLowerCase().includes('com') || 
      k.toLowerCase().includes('nom')
    );
    
    const keysToSearch = possibleKeys.length > 0 ? possibleKeys : Object.keys(properties);

    for (const key of keysToSearch) {
      const rawVal = String(properties[key]).toLowerCase();
      const cleaned = normalizarComuna(rawVal);
      
      if (COMUNAS_V_REGION.includes(cleaned)) return cleaned;
      
      if (rawVal.includes("del mar")) return "vina del mar";
      if (rawVal.includes("valpara")) return "valparaiso";
      if (rawVal.includes("quilpu")) return "quilpue";
      if (rawVal.includes("concon") || rawVal.includes("con cón")) return "concon";
      if (rawVal.includes("llay") || rawVal.includes("llai")) return "llai llay";
    }
    return ''; 
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Total Comunas V Región</h4>
          <p style={kpiValueStyle}>{ranking.length}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Comuna Mayoritaria</h4>
          <p style={{...kpiValueStyle, color: COLORS.naranjo, fontSize: 'clamp(1.1rem, 2.2vw, 1.6rem)'}}>
            {ranking.length > 0 ? ranking[0].comuna.toUpperCase() : '-'}
          </p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Trabajadores (Mayoritaria)</h4>
          <p style={kpiValueStyle}>{ranking.length > 0 ? ranking[0].count : 0}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        
        <div style={{...cardStyle, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ color: COLORS.naranjo }}><MapPin size={24} /></div>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 }}>Mapa de Distribución Geográfica (V Región Continental)</h4>
          </div>

          {/* AQUÍ ESTÁ EL EFECTO DEL MAR: Cambiamos el fondo a azul suave */}
          <div style={{ position: 'relative', width: '100%', height: '500px', backgroundColor: COLORS.mar, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
            
            {mapStatus && (
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(255,255,255,0.95)', padding: '20px', borderRadius: '8px', border: '2px solid red', textAlign: 'center', zIndex: 20 }}>
                <p style={{ fontWeight: 'bold', color: 'red', margin: 0 }}>{mapStatus}</p>
              </div>
            )}

            {tooltip && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, borderLeft: `4px solid ${COLORS.naranjo}` }}>
                <p style={{ margin: 0, fontWeight: 700, color: COLORS.gris, textTransform: 'capitalize' }}>{tooltip.split(':')[0]}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: COLORS.celeste, fontWeight: 600 }}>{tooltip.split(':')[1]}</p>
              </div>
            )}

            {geoData && (
              <ComposableMap 
                projection="geoMercator" 
                projectionConfig={{ scale: 22000, center: [-71.4, -32.9] }}
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup zoom={1} minZoom={1} maxZoom={5}>
                  <Geographies geography={geoData}>
                    {({ geographies }: any) => {
                      
                      const hasVRegion = geographies.some((geo: any) => getComunaName(geo.properties) !== '');

                      if (geographies.length > 0 && !hasVRegion) {
                        return (
                          <text x="50" y="50" fill="red" fontSize="14" fontWeight="bold">
                            ⚠️ Error: No se detectaron comunas de la V Región en el archivo.
                          </text>
                        );
                      }

                      // AQUÍ ESTÁ EL TRUCO: Dibujamos TODO Chile, pero filtramos visualmente
                      return geographies.map((geo: any) => {
                        const nombreCartografia = getComunaName(geo.properties);
                        const isVRegion = nombreCartografia !== '';

                        // SI ES DE LA V REGIÓN: Aplicamos colores, bordes blancos gruesos e interactividad
                        if (isVRegion) {
                          const count = comunasData[nombreCartografia] || 0;
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              onMouseEnter={() => setTooltip(`${nombreCartografia}: ${count} trabajadores`)}
                              onMouseLeave={() => setTooltip("")}
                              style={{
                                default: {
                                  fill: count > 0 ? colorScale(count) : COLORS.mapaVacio,
                                  stroke: "#ffffff",
                                  strokeWidth: 0.8, // Borde blanco para destacar
                                  outline: "none",
                                  transition: "all 250ms"
                                },
                                hover: { fill: count > 0 ? '#C2185B' : '#d1d5db', cursor: "pointer", outline: "none", strokeWidth: 1.5 },
                                pressed: { outline: "none" }
                              }}
                            />
                          );
                        } 
                        // SI NO ES DE LA V REGIÓN: Color gris plano y bordes del mismo gris para crear una masa sólida
                        else {
                          return (
                            <Geography
                              key={geo.rsmKey}
                              geography={geo}
                              style={{
                                default: {
                                  fill: COLORS.regionExterna,
                                  stroke: COLORS.regionExterna, // Al ser igual al relleno, los bordes "desaparecen"
                                  strokeWidth: 1,
                                  outline: "none"
                                },
                                hover: { fill: COLORS.regionExterna, outline: "none", cursor: "default" },
                                pressed: { outline: "none" }
                              }}
                            />
                          );
                        }
                      });
                    }}
                  </Geographies>
                </ZoomableGroup>
              </ComposableMap>
            )}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ color: COLORS.celeste }}><Users size={24} /></div>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 }}>Ranking V Región</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
            {ranking.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Esperando datos del Excel maestro...</p>
            ) : (
              ranking.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: COLORS.fondo, borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: idx < 3 ? COLORS.naranjo : COLORS.celeste, color: COLORS.blanco, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>
                      {idx + 1}
                    </div>
                    <p style={{ margin: 0, fontWeight: 600, color: COLORS.gris, fontSize: '0.95rem', textTransform: 'capitalize' }}>
                      {item.comuna}
                    </p>
                  </div>
                  <span style={{ fontWeight: 600, color: COLORS.celeste }}>{item.count}</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 200px', minWidth: 0, backgroundColor: COLORS.blanco, padding: '20px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px', borderTop: `5px solid ${COLORS.celeste}` };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 600, margin: '10px 0 0 0' };
