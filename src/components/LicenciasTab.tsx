import { Bar, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import ChartJSPluginDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  ArcElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartJSPluginDataLabels
);

ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  pieColors: ['#C2185B', '#0098aa', '#f4ab03', '#e45302', '#36424a', '#8B9BB4', '#4A90E2', '#D0021B']
};

interface LicenciasProps {
  rawData: any[];
}

export default function LicenciasTab({ rawData }: LicenciasProps) {
  
  const licenciasData = rawData.filter(row => row['Rut'] && String(row['Rut']).trim() !== '');

  const totalLicencias = licenciasData.length;
  let totalDiasLicenciaActual = 0;
  let totalDias12Meses = 0; 
  let totalDias24Meses = 0; 

  licenciasData.forEach(row => {
    totalDiasLicenciaActual += Number(row['Días'] || row['Dias']) || 0;
    const dias12 = row['Días acumulados últimos 12 meses '] || row['Días acumulados últimos 12 meses'] || 0;
    const dias24 = row['Días acumulados últimos 24 meses '] || row['Días acumulados últimos 24 meses'] || 0;
    totalDias12Meses += Number(dias12) || 0;
    totalDias24Meses += Number(dias24) || 0;
  });

  const promedioDias = totalLicencias > 0 ? (totalDiasLicenciaActual / totalLicencias).toFixed(1) : "0";

  const getLicenciasPorGerencia = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      const g = row['Superintendencia / Dirección / Gerencia']?.trim() || 'No especificada';
      counts[g] = (counts[g] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      labels: sortedKeys,
      datasets: [{ label: 'Cantidad', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.celeste, borderRadius: 4 }]
    };
  };

  const getEspecialidadData = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      let esp = row['Especialidad']?.trim() || 'No especificada';
      if (esp === '') esp = 'No especificada';
      counts[esp] = (counts[esp] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      labels: sortedKeys,
      datasets: [{ data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.pieColors, borderWidth: 2, borderColor: COLORS.blanco }]
    };
  };

  const getGrupoData = () => {
    const counts: { [key: string]: number } = { 'Grupo 1': 0, 'Grupo 2': 0, 'Grupo 3': 0, 'Grupo 4': 0, 'Admin.': 0 };
    licenciasData.forEach(row => {
      let g = row['Grupo']?.trim() || 'Admin.';
      if (g === '-' || g.toLowerCase().includes('admin')) g = 'Admin.';
      else if (['1', 'Grupo 1'].includes(g)) g = 'Grupo 1';
      else if (['2', 'Grupo 2'].includes(g)) g = 'Grupo 2';
      else if (['3', 'Grupo 3'].includes(g)) g = 'Grupo 3';
      else if (['4', 'Grupo 4'].includes(g)) g = 'Grupo 4';
      else g = 'Admin.';
      counts[g]++;
    });
    return {
      labels: Object.keys(counts),
      datasets: [{ label: 'Licencias', data: Object.values(counts), backgroundColor: COLORS.naranjo, borderRadius: 4 }]
    };
  };

  const getContinuacionData = () => {
    const counts: { [key: string]: number } = { 'Nueva': 0, 'Continuación': 0 };
    licenciasData.forEach(row => {
      const ext = row['Continuación']?.trim() || 'Nueva';
      if (ext.toLowerCase().includes('continua')) counts['Continuación']++;
      else counts['Nueva']++;
    });
    return {
      labels: Object.keys(counts),
      datasets: [{ label: 'Cantidad', data: Object.values(counts), backgroundColor: [COLORS.celeste, COLORS.rosado], borderRadius: 4 }]
    };
  };

  // --- Opciones de Gráficos (Ajustadas con fuentes fluidas) ---
  const datalabelConfig = { color: COLORS.blanco, font: { weight: 600, size: 10, family: "'Poppins', sans-serif" } };
  
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 10, family: "'Poppins', sans-serif" } } }, datalabels: datalabelConfig } };
  const horizontalBarOptions: any = { ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } };
  const verticalBarOptions: any = { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false }, datalabels: { ...datalabelConfig, anchor: 'end', align: 'start' } } };
  const doughnutOptions: any = { ...commonOptions, cutout: '65%', plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9, family: "'Poppins', sans-serif" } } } } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(15px, 3vw, 25px)', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 1. Resumen Superior (Inquebrantable en una línea. 4 tarjetas requieren más reducción en celular) */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'clamp(5px, 1.5vw, 20px)', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Licencias</h4><p style={kpiValueStyle}>{totalLicencias}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Días Acum.<br/>(Últimos 12)</h4><p style={{...kpiValueStyle, color: COLORS.naranjo}}>{totalDias12Meses}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Días Acum.<br/>(Últimos 24)</h4><p style={{...kpiValueStyle, color: COLORS.gris}}>{totalDias24Meses}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Promedio<br/>Días / Lic.</h4><p style={kpiValueStyle}>{promedioDias}</p></div>
      </div>

      {/* 2. Cuadrícula Principal (2 gráficos por línea en PC, baja a 1 en Celular para que no se aplasten) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))', gap: 'clamp(15px, 3vw, 20px)' }}>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Cantidad de Licencias por Gerencia</h4><div style={{ width: '100%', height: '300px' }}><Bar data={getLicenciasPorGerencia()} options={horizontalBarOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Especialidad Médica</h4><div style={{ width: '100%', height: '300px' }}><Doughnut data={getEspecialidadData()} options={doughnutOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Grupo de Trabajo</h4><div style={{ width: '100%', height: '300px' }}><Bar data={getGrupoData()} options={verticalBarOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Análisis de Extensión (Nuevas vs Continuación)</h4><div style={{ width: '100%', height: '300px' }}><Bar data={getContinuacionData()} options={verticalBarOptions} /></div></div>
      </div>
      
    </div>
  );
}

// Estilos fluidos y elásticos con minWidth: 0
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: 'clamp(10px, 2vw, 20px)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
// Se reduce drásticamente el padding horizontal en móviles para que quepan las 4 tarjetas
const summaryCardStyle: React.CSSProperties = { flex: 1, minWidth: 0, backgroundColor: COLORS.blanco, padding: 'clamp(8px, 1.5vw, 20px) clamp(2px, 0.5vw, 10px)', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' };
// Fuente muy elástica para títulos largos en 4 columnas
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: 'clamp(0.55rem, 1.5vw, 0.9rem)', fontWeight: 600, lineHeight: 1.2 };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 4vw, 2.2rem)', fontWeight: 600, color: COLORS.celeste, margin: '5px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: 'clamp(0.75rem, 2vw, 1.1rem)', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '8px', whiteSpace: 'normal', lineHeight: 1.2 };
