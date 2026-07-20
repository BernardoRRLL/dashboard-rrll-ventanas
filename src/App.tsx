import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Users, Venus, Handshake, Stethoscope, Scale, Accessibility, Gift } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import DotacionTab from './components/DotacionTab';
import ParticipacionFemeninaTab from './components/ParticipacionFemeninaTab';
import SindicatosTab from './components/SindicatosTab';
import LicenciasTab from './components/LicenciasTab';
import AusentismoTab from './components/AusentismoTab';
import DiscapacidadTab from './components/DiscapacidadTab';
import CumpleanosTab from './components/CumpleanosTab';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import ChartJSPluginDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, ChartJSPluginDataLabels);

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  fondo: '#f5f7f8',
  blanco: '#ffffff'
};

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });
  
  const [rawData, setRawData] = useState<any[]>([]); 
  const [licenciasData, setLicenciasData] = useState<any[]>([]); 
  const [ausentismoData, setAusentismoData] = useState<any[]>([]); 
  const [discapacidadData, setDiscapacidadData] = useState<any[]>([]); 
  const [globalSummary, setGlobalSummary] = useState({ total: 0, mujeres: "0", ausentismo: "0", sobretiempo: "0" });
  const [dotacionStats, setDotacionStats] = useState({ total: 0, indefinido: "0", edadPromedio: "0", edadPromedioF: "0", edadPromedioM: "0" });
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTab(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleTabChange = (tabId: string) => {
    window.location.hash = tabId === 'home' ? '' : tabId;
    setActiveTab(tabId);
  };

  useEffect(() => {
    const loadFixedData = async () => {
      try {
        const response = await fetch('./data.xlsx');
        if (!response.ok) throw new Error("No se encontró el archivo data.xlsx");
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        let dotacionName = sheetNames.find(n => n === "Dotación" || n.toLowerCase().includes('dotaci')) || sheetNames[0];
        let licenciasName = sheetNames.find(n => n === "Licencias" || n.toLowerCase().includes('licencia')) || (sheetNames.length > 1 ? sheetNames[1] : null);
        let ausentismoName = sheetNames.find(n => n.toLowerCase().includes('ausdeo') || n.toLowerCase().includes('ausentismo'));
        let discapacidadName = sheetNames.find(n => n.toLowerCase().includes('discapacidad') || n.toLowerCase().includes('disc'));

        const dotacionJson = XLSX.utils.sheet_to_json(workbook.Sheets[dotacionName], { raw: false, defval: "" });
        const licenciasJson = licenciasName ? XLSX.utils.sheet_to_json(workbook.Sheets[licenciasName], { raw: false, defval: "" }) : dotacionJson;
        const ausentismoJson = ausentismoName ? XLSX.utils.sheet_to_json(workbook.Sheets[ausentismoName], { header: 1, raw: false, defval: "" }) as any : [];
        const discapacidadJson = discapacidadName ? XLSX.utils.sheet_to_json(workbook.Sheets[discapacidadName], { raw: false, defval: "" }) : [];

        setRawData(dotacionJson);
        setLicenciasData(licenciasJson);
        setAusentismoData(ausentismoJson);
        setDiscapacidadData(discapacidadJson);
        
        calculateSummaries(dotacionJson, ausentismoJson);
        setIsLoading(false); 

      } catch (error) {
        console.error("Error al cargar la base de datos:", error);
        setIsLoading(false);
      }
    };

    loadFixedData();
  }, []);

  const calculateSummaries = (dotData: any[], ausData: any) => {
    const total = dotData.length; 
    if (total === 0) return;

    const mujeres = dotData.filter(row => String(row.Sexo).trim() === 'F').length;
    const indefinidos = dotData.filter(row => String(row['Tipo Contrato']).trim() === 'Indefinido').length;
    
    let sumaEdades = 0, sumaF = 0, totalF = 0, sumaM = 0, totalM = 0;
    dotData.forEach((row: any) => {
      const edad = Number(row['Edad']) || 0; 
      const sexo = String(row['Sexo'] || '').trim();
      if (edad > 0) {
        sumaEdades += edad;
        if (sexo === 'F') { sumaF += edad; totalF++; }
        if (sexo === 'M') { sumaM += edad; totalM++; }
      }
    });

    let ausentismoTotal = 0;
    let sobretiempoTotal = 0; 
    
    if (ausData && ausData.length > 0) {
      const parsePercent = (val: any) => {
        const str = String(val).trim().replace(',', '.');
        if (str.includes('%')) return parseFloat(str.replace('%', ''));
        return parseFloat(str) * 100;
      };

      const getRowData = (keyword: string, occurrence = 1) => {
        const rows = ausData.filter((r: any) => r.some((cell: any) => String(cell).trim() === keyword));
        const targetRow = rows[occurrence - 1];
        if (!targetRow) return [];
        const idx = targetRow.findIndex((cell: any) => String(cell).trim() === keyword);
        const values = [];
        for (let i = idx + 1; i <= idx + 12; i++) {
          if (targetRow[i] !== undefined && targetRow[i] !== "") {
            const val = parsePercent(targetRow[i]);
            if (!isNaN(val)) values.push(val);
          }
        }
        return values;
      };

      const areas = ['Mantenimiento', 'Refino a Fuego', 'Refineria', 'Staff'];
      let sumLM = 0, sumPermisos = 0, sumST = 0;
      
      areas.forEach((area: string) => {
        const vals = getRowData(area, 1);
        sumLM += vals[0] || 0;
        sumPermisos += vals[1] || 0;
        
        const valsST = getRowData(area, 2);
        sumST += valsST[0] || 0;
      });
      
      ausentismoTotal = sumLM + sumPermisos;
      sobretiempoTotal = sumST;
    }

    setGlobalSummary({ 
      total, 
      mujeres: ((mujeres / total) * 100).toFixed(1), 
      ausentismo: ausentismoTotal.toFixed(2),
      sobretiempo: sobretiempoTotal.toFixed(2) 
    });

    setDotacionStats({ total, indefinido: ((indefinidos / total) * 100).toFixed(1), edadPromedio: (sumaEdades / total).toFixed(1), edadPromedioF: totalF > 0 ? (sumaF / totalF).toFixed(1) : "0", edadPromedioM: totalM > 0 ? (sumaM / totalM).toFixed(1) : "0" });
  };

  const renderHomeMenu = () => {
    const menuItems = [
      { id: 'dotacion', label: 'Dotación', icon: <Users size={38} /> },
      { id: 'participacion', label: 'Participación Femenina', icon: <Venus size={38} /> },
      { id: 'sindicatos', label: 'Sindicatos', icon: <Handshake size={38} /> },
      { id: 'licencias', label: 'Licencias Médicas', icon: <Stethoscope size={38} /> },
      { id: 'ausentismo', label: 'Ausentismo y Sobretiempo', icon: <Scale size={38} /> },
      { id: 'discapacidad', label: 'Discapacidad', icon: <Accessibility size={38} /> },
      { id: 'cumpleanos', label: 'Cumpleaños', icon: <Gift size={38} /> },
    ];

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 30vw, 320px), 1fr))', gap: '20px', marginTop: '30px' }}>
        {menuItems.map((item: any) => (
          <button key={item.id} onClick={() => handleTabChange(item.id)} style={gridButtonStyle}>
            <div style={{ color: COLORS.celeste, marginBottom: '12px' }}>{item.icon}</div>
            <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', fontWeight: 600, color: COLORS.gris, textAlign: 'center' }}>{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: COLORS.fondo, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      
      <div style={{ maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '30px 20px', flex: 1 }}>
        
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: COLORS.gris }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Cargando base de datos corporativa...</h2>
            <p style={{ color: '#666' }}>Sincronizando información de RRLL</p>
          </div>
        )}

        {!isLoading && activeTab === 'home' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'clamp(6px, 1.5vw, 20px)', width: '100%', justifyContent: 'space-between', marginBottom: '25px' }}>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Dotación Total</h3>
                <p style={summaryValueStyle}>{globalSummary.total}</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Part. Femenina</h3>
                <p style={summaryValueStyle}>{globalSummary.mujeres}%</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Ausentismo</h3>
                <p style={summaryValueStyle}>{globalSummary.ausentismo}%</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Sobretiempo</h3>
                <p style={summaryValueStyle}>{globalSummary.sobretiempo}%</p>
              </div>
            </div>

            <div style={{ borderBottom: `2px solid #ddd`, margin: '40px 0 20px 0', display: 'flex', alignItems: 'center' }}>
              <h2 style={{ color: COLORS.gris, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: 600, margin: 0, paddingBottom: '10px', borderBottom: `4px solid ${COLORS.naranjo}`, marginBottom: '-3px' }}>
                Módulos de Análisis
              </h2>
            </div>

            {renderHomeMenu()}
            
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <p style={{ color: 'green', fontSize: '0.85rem', fontWeight: 600 }}>✓ Datos sincronizados correctamente desde archivo central</p>
            </div>
          </>
        )}

        {!isLoading && activeTab !== 'home' && (
          <div>
            <button onClick={() => handleTabChange('home')} style={backButtonStyle}>← Volver al Menú Principal</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <div style={{ color: COLORS.naranjo }}>
                {activeTab === 'participacion' ? <Venus size={32} /> : activeTab === 'sindicatos' ? <Handshake size={32} /> : activeTab === 'licencias' ? <Stethoscope size={32} /> : activeTab === 'ausentismo' ? <Scale size={32} /> : activeTab === 'discapacidad' ? <Accessibility size={32} /> : activeTab === 'cumpleanos' ? <Gift size={32} /> : <Users size={32} />}
              </div>
              <h2 style={{ color: COLORS.gris, margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 600 }}>
                {activeTab === 'dotacion' ? 'Análisis Dotacional' : activeTab === 'participacion' ? 'Participación Femenina' : activeTab === 'sindicatos' ? 'Organizaciones Sindicales' : activeTab === 'licencias' ? 'Licencias Médicas' : activeTab === 'ausentismo' ? 'Ausentismo y Sobretiempo' : activeTab === 'discapacidad' ? 'Inclusión y Discapacidad' : activeTab === 'cumpleanos' ? 'Gestión de Cumpleaños' : activeTab.toUpperCase()}
              </h2>
            </div>
            
            {activeTab === 'dotacion' ? (
              <DotacionTab rawData={rawData} stats={dotacionStats} />
            ) : activeTab === 'participacion' ? (
              <ParticipacionFemeninaTab rawData={rawData} />
            ) : activeTab === 'sindicatos' ? (
              <SindicatosTab rawData={rawData} />
            ) : activeTab === 'licencias' ? (
              <LicenciasTab rawData={licenciasData} />
            ) : activeTab === 'ausentismo' ? (
              <AusentismoTab rawData={ausentismoData} /> 
            ) : activeTab === 'discapacidad' ? (
              <DiscapacidadTab rawData={discapacidadData} /> 
            ) : activeTab === 'cumpleanos' ? (
              <CumpleanosTab rawData={rawData} /> 
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: COLORS.blanco, borderRadius: '8px' }}>
                <p>Módulo de {activeTab} en desarrollo...</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 0, backgroundColor: COLORS.blanco, padding: 'clamp(8px, 1.8vw, 20px) 4px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px', borderTop: `5px solid ${COLORS.celeste}` };
const summaryTitleStyle: React.CSSProperties = { margin: 0, color: '#666', fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const summaryValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 3.2vw, 2.8rem)', fontWeight: 600, color: COLORS.celeste, margin: '6px 0 0 0' };
const gridButtonStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, border: '1px solid #eee', borderRadius: '12px', padding: 'clamp(20px, 4vw, 45px) 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' };
const backButtonStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', color: COLORS.naranjo, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', margin: '0 0 20px 0', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' };
