import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';

ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  // Paleta extendida para especialidades que pueden ser muchas
  pieColors: ['#C2185B', '#0098aa', '#f4ab03', '#e45302', '#36424a', '#8B9BB4', '#4A90E2', '#D0021B']
};

interface LicenciasProps {
  rawData: any[];
}

export default function LicenciasTab({ rawData }: LicenciasProps) {
  
  // Filtrar filas válidas que tengan un RUT asignado
  const licenciasData = rawData.filter(row => row['Rut'] && String(row['Rut']).trim() !== '');

  // 1. KPIs de Resumen Superior
  const totalLicencias = licenciasData.length;

  let totalDiasLicenciaActual = 0;
  let totalDias12Meses = 0; 
  let totalDias24Meses = 0; 

  licenciasData.forEach(row => {
    totalDiasLicenciaActual += Number(row['Días'] || row['Dias']) || 0;
    
    // Captura exacta de los encabezados de columnas de días acumulados
    const dias12 = row['Días acumulados últimos 12 meses '] || row['Días acumulados últimos 12 meses'] || 0;
    const dias24 = row['Días acumulados últimos 24 meses '] || row['Días acumulados últimos 24 meses'] || 0;
    
    totalDias12Meses += Number(dias12) || 0;
    totalDias24Meses += Number(dias24) || 0;
  });

  const promedioDias = totalLicencias > 0 ? (totalDiasLicenciaActual / totalLicencias).toFixed(1) : "0";

  // Gráfico: Cantidad de Licencias por Gerencia (Columna E)
  const getLicenciasPorGerencia = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      const g = row['Superintendencia / Dirección / Gerencia']?.trim() || 'No especificada';
      counts[g] = (counts[g] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      labels: sortedKeys,
      datasets: [{ label: 'Cantidad de Licencias', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.celeste, borderRadius: 4 }]
    };
  };

  // Gráfico: Distribución por Especialidad Médica (Corregido a la columna Especialidad)
  const getEspecialidadData = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      // Ahora leemos la columna Especialidad
      let esp = row['Especialidad']?.trim() || 'No especificada';
      if (esp === '') esp = 'No especificada';
      counts[esp] = (counts[esp] || 0) + 1;
    });
    
    // Ordenamos de mayor a menor para que las especialidades más comunes salgan primero en la torta
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    
    return {
      labels: sortedKeys,
      datasets: [{ data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.pieColors, borderWidth: 2, borderColor: COLORS.blanco }]
    };
  };

  // Gráfico: Distribución por Grupo (Columna G)
  const getGrupoData = () => {
    const counts: { [key: string]: number } = { 'Grupo 1': 0, 'Grupo 2': 0, 'Grupo 3': 0, 'Grupo 4': 0, 'Admin.': 0 };
    
    licenciasData.forEach(row => {
      let g = row['Grupo']?.trim() || 'Admin.';
      if (g === '-' || g.toLowerCase().includes('admin')) {
        g = 'Admin.';
      } else if (g === '1' || g.toLowerCase() === 'grupo 1') {
        g = 'Grupo 1';
      } else if (g === '2' || g.toLowerCase() === 'grupo 2') {
        g = 'Grupo 2';
      } else if (g === '3' || g.toLowerCase() === 'grupo 3') {
        g = 'Grupo 3';
      } else if (g === '4' || g.toLowerCase() === 'grupo 4') {
        g = 'Grupo 4';
      } else {
        g = 'Admin.';
      }
      counts[g]++;
    });

    return {
      labels: Object.keys(counts),
      datasets: [{ label: 'Licencias', data: Object.values(counts), backgroundColor: COLORS.naranjo, borderRadius: 4 }]
    };
  };

  // Gráfico: Licencias Nuevas vs Continuación (Columna L)
  const getContinuacionData = () => {
    const counts: { [key: string]: number } = { 'Nueva': 0, 'Continuación': 0 };
    
    licenciasData.forEach(row => {
      const ext = row['Continuación']?.trim() || 'Nueva';
      if (ext.toLowerCase().includes('continua')) {
        counts['Continuación']++;
      } else {
        counts['Nueva']++;
      }
    });

    return {
      labels: Object.keys(counts),
      datasets: [{
        label: 'Cantidad',
        data: Object.values(counts),
        backgroundColor: [COLORS.celeste, COLORS.rosado],
        borderRadius: 4
      }]
    };
  };

  // Opciones visuales de Chart.js
  const horizontalBarOptions: any = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600 } } } };
  const verticalBarOptions: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600 } } } };
  const doughnutOptions: any = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'right', labels: { font: { size: 10, family: "'Poppins', sans-serif" } } }, datalabels: { color: COLORS.blanco, font: { weight: 600, family: "'Poppins', sans-serif" }, formatter: (value: number) => value > 0 ? value : '' } } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Resumen Superior */}
      <div style={{ display: 'flex', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Licencias Registradas</h4>
          <p style={kpiValueStyle}>{totalLicencias}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Días Acum. <br /><span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>(Últimos 12 Meses)</span></h4>
          <p style={{...kpiValueStyle, color: COLORS.naranjo}}>{totalDias12Meses}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Días Acum. <br /><span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>(Últimos 24 Meses)</span></h4>
          <p style={{...kpiValueStyle, color: COLORS.gris}}>{totalDias24Meses}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Promedio Días / Licencia</h4>
          <p style={kpiValueStyle}>{promedioDias}</p>
        </div>
      </div>

      {/* Cuadrícula de Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Cantidad de Licencias por Gerencia</h4><div style={{ height: '300px' }}><Bar data={getLicenciasPorGerencia()} options={horizontalBarOptions} /></div></div>
        
        {/* Gráfico de Especialidad actualizado */}
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Especialidad Médica</h4><div style={{ height: '300px' }}><Doughnut data={getEspecialidadData()} options={doughnutOptions} /></div></div>
        
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución de Licencias por Grupo de Trabajo</h4><div style={{ height: '300px' }}><Bar data={getGrupoData()} options={verticalBarOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Análisis de Extensión (Licencias Nuevas vs Continuación)</h4><div style={{ height: '300px' }}><Bar data={getContinuacionData()} options={verticalBarOptions} /></div></div>
      </div>

    </div>
  );
}

// Estilos de contenedores
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const summaryCardStyle: React.CSSProperties = { flex: 1, backgroundColor: COLORS.blanco, padding: '20px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '0.95rem', fontWeight: 600, lineHeight: '1.3' };
const kpiValueStyle: React.CSSProperties = { fontSize: '2.4rem', fontWeight: 600, color: COLORS.celeste, margin: '5px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' };
