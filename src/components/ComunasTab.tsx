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
  mapaVacio: '#e2e8f0'
};

const geoUrl = "https://raw.githubusercontent.com/BastianOlea/geojson-chile/master/topojson/comunas.json";

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

  const cleanName = (name: string) => 
    String(name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  useEffect(() => {
    const counts: Record<string, number> = {};
    let max = 0;

    if (!rawData || rawData.length === 0) return;

    rawData.forEach((row: any) => {
      // Búsqueda ultra flexible de la columna Comuna en el objeto Row
      let comunaValor = '';
      
      // Buscamos cualquier propiedad de la fila que contenga la palabra 'comuna'
      const llaveEncontrada = Object.keys(row).find(k => k.toLowerCase().includes('comuna'));
      
      if (llaveEncontrada) {
        comunaValor = String(row[llaveEncontrada]).trim();
      }

      if (comunaValor) {
        const cleaned = cleanName(comunaValor);
        counts[cleaned] = (counts[cleaned] || 0) + 1;
        if (counts[cleaned] > max) {
          max = counts[cleaned];
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

  const colorScale = scaleLinear()
    .domain([0, maxCount === 0 ? 1 : maxCount])
    .range(["#e8f4f5", COLORS.naranjo]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Total Comunas</h4>
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

          <div style={{ position: 'relative', width: '100%', height: '500px', backgroundColor: '#eef5f9', borderRadius: '8px', overflow: 'hidden' }}>
            
            {tooltip && (
              <div style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'rgba(255,255,255,0.95)', padding: '10px 15px', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', zIndex: 10, borderLeft: `4px solid ${COLORS.naranjo}` }}>
                <p style={{ margin: 0, fontWeight: 700, color: COLORS.gris, textTransform: 'capitalize' }}>{tooltip.split(':')[0]}</p>
                <p style={{ margin: 0, fontSize: '0.9rem', color: COLORS.celeste, fontWeight: 600 }}>{tooltip.split(':')[1]}</p>
              </div>
            )}

            <ComposableMap 
              projection="geoMercator" 
              projectionConfig={{ scale: 20000, center: [-71.2, -32.8] }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup zoom={1}>
                <Geographies geography={geoUrl}>
                  {({ geographies }: any) =>
                    geographies.map((geo: any) => {
                      const nombreCartografia = cleanName(geo.properties.Comuna || geo.properties.nom_comuna || '');
                      
                      if (!COMUNAS_V_REGION.includes(nombreCartografia)) return null;

                      const count = comunasData[nombreCartografia] || 0;
                      
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => setTooltip(`${geo.properties.Comuna || geo.properties.nom_comuna}: ${count} trabajadores`)}
                          onMouseLeave={() => setTooltip("")}
                          style={{
                            default: {
                              fill: count > 0 ? colorScale(count) : COLORS.mapaVacio,
                              stroke: "#ffffff",
                              strokeWidth: 0.7,
                              outline: "none",
                              transition: "all 250ms"
                            },
                            hover: {
                              fill: count > 0 ? '#C2185B' : '#d1d5db',
                              stroke: "#ffffff",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: "pointer",
                              transition: "all 250ms"
                            },
                            pressed: {
                              fill: COLORS.gris,
                              outline: "none"
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
            <div style={{ color: COLORS.celeste }}><Users size={24} /></div>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 }}>Top Comunas</h4>
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
                  <span style={{ fontWeight: 700, color: COLORS.celeste }}>{item.count}</span>
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
