import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';

// Forzar Poppins en todos los gráficos
ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  // Paleta alineada para tortas y gráficos con muchos datos
  pieColors: ['#0098aa', '#e45302', '#f4ab03', '#36424a', '#4A90E2', '#8B9BB4', '#2C5282', '#A8B7C4']
};

interface DotacionTabProps {
  rawData: any[];
  stats: { total: number; indefinido: string; edadPromedio: string; edadPromedioF: string; edadPromedioM: string; };
}

export default function DotacionTab({ rawData, stats }: DotacionTabProps) {
  
  const getGerenciaData = () => {
    const counts: { [key: string]: number } = {};
    rawData.forEach(row => { const val = row['Gerencia / Superintendencia']?.trim() || 'Otra'; counts[val] = (counts[val] || 0) + 1; });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { labels: sortedKeys, datasets: [{ label: 'Dotación', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.celeste, borderRadius: 4 }] };
  };

  const getEdadPromedioPorGerencia = () => {
    const gerencias: { [key: string]: { suma: number, total: number } } = {};
    rawData.forEach(row => {
      const g = row['Gerencia / Superintendencia']?.trim() || 'Otra'; const edad = Number(row['Edad']) || 0;
      if (edad > 0) { if (!gerencias[g]) gerencias[g] = { suma: 0, total: 0 }; gerencias[g].suma += edad; gerencias[g].total += 1; }
    });
    const labels = Object.keys(gerencias);
    return { labels, datasets: [{ label: 'Edad Promedio', data: labels.map(g => (gerencias[g].suma / gerencias[g].total).toFixed(1)), backgroundColor: COLORS.naranjo, borderRadius: 4 }] };
  };

  const getRangoEtarioData = () => {
    const rangos = { 'Hasta 30': 0, '31 - 40': 0, '41 - 50': 0, '51 - 60': 0, 'Más de 60': 0 };
    rawData.forEach(row => {
      const edad = Number(row['Edad']); if (!edad) return;
      if (edad <= 30) rangos['Hasta 30']++; else if (edad <= 40) rangos['31 - 40']++; else if (edad <= 50) rangos['41 - 50']++; else if (edad <= 60) rangos['51 - 60']++; else rangos['Más de 60']++;
    });
    return { labels: Object.keys(rangos), datasets: [{ label: 'Cantidad', data: Object.values(rangos), backgroundColor: COLORS.celeste, borderRadius: 4 }] };
  };

  const getRangoEtarioPorSexoData = () => {
    const rangos = ['Hasta 30', '31 - 40', '41 - 50', '51 - 60', 'Más de 60'];
    const varones = [0, 0, 0, 0, 0]; const damas = [0, 0, 0, 0, 0];
    rawData.forEach(row => {
      const edad = Number(row['Edad']); const sexo = row['Sexo']?.trim(); if (!edad) return;
      let idx = edad <= 30 ? 0 : edad <= 40 ? 1 : edad <= 50 ? 2 : edad <= 60 ? 3 : 4;
      if (sexo === 'M') varones[idx]++; if (sexo === 'F') damas[idx]--;
    });
    return {
      labels: rangos,
      datasets: [
        { label: 'Femenino', data: damas, backgroundColor: COLORS.naranjo, borderRadius: 4 },
        { label: 'Masculino', data: varones, backgroundColor: COLORS.celeste, borderRadius: 4 }
      ]
    };
  };

  const getPieOrBarData = (key: string) => {
    const counts: { [key: string]: number } = {};
    rawData.forEach(row => {
      let val = row[key]?.trim() || 'No especificado';
      if (key === 'Grupo' && val === '-') val = 'Adm.';
      counts[val] = (counts[val] || 0) + 1;
    });
    return { labels: Object.keys(counts), datasets: [{ data: Object.values(counts), backgroundColor: COLORS.pieColors, borderWidth: 1, borderColor: COLORS.blanco }] };
  };

  const getRolBarData = () => {
    const counts: { [key: string]: number } = {};
    rawData.forEach(row => { const val = row['Rol']?.trim() || 'No especificado'; counts[val] = (counts[val] || 0) + 1; });
    return { labels: Object.keys(counts), datasets: [{ label: 'Colaboradores', data: Object.values(counts), backgroundColor: COLORS.pieColors, borderRadius: 4 }] };
  };

  const commonBarOptions: any = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, datalabels: { color: '#ffffff', anchor: 'end', align: 'start', font: { weight: 600, size: 11, family: "'Poppins', sans-serif" }, formatter: (value: number) => value } }
  };

  const butterflyOptions: any = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true, ticks: { callback: (val: number) => Math.abs(val) } }, y: { stacked: true } },
    plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${Math.abs(ctx.raw)}` } }, datalabels: { color: '#ffffff', font: { weight: 600, family: "'Poppins', sans-serif" }, formatter: (value: number) => value !== 0 ? Math.abs(value) : '' } }
  };

  const pieOptions: any = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 10, family: "'Poppins', sans-serif" } } }, datalabels: { color: '#ffffff', font: { weight: 600, size: 11, family: "'Poppins', sans-serif" } } }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Resumen Superior distribuido a lo ancho (flex: 1) y centrado */}
      <div style={{ display: 'flex', gap: '25px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Dotación</h4><p style={kpiValueStyle}>{stats.total}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Contratos Indefinidos</h4><p style={kpiValueStyle}>{stats.indefinido}%</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Edad Promedio</h4><p style={kpiValueStyle}>{stats.edadPromedio}</p></div>
      </div>

      <div style={cardStyle}><h4 style={chartTitleStyle}>Dotación por Gerencia / Superintendencia</h4><div style={{ height: '350px' }}><Bar data={getGerenciaData()} options={commonBarOptions} /></div></div>
      <div style={cardStyle}><h4 style={chartTitleStyle}>Edad Promedio por Gerencia / Superintendencia</h4><div style={{ height: '350px' }}><Bar data={getEdadPromedioPorGerencia()} options={commonBarOptions} /></div></div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Rango Etario</h4><div style={{ height: '300px' }}><Bar data={getRangoEtarioData()} options={commonBarOptions} /></div></div>
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1rem', fontWeight: 600 }}>Rango Etario por Sexo</h4>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Promedio: <span style={{color: COLORS.naranjo, fontWeight: 600}}>F {stats.edadPromedioF}</span> | <span style={{color: COLORS.celeste, fontWeight: 600}}>M {stats.edadPromedioM}</span></div>
          </div>
          <div style={{ height: '260px' }}><Bar data={getRangoEtarioPorSexoData()} options={butterflyOptions} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Grupo</h4><div style={{ height: '220px' }}><Pie data={getPieOrBarData('Grupo')} options={pieOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Turno</h4><div style={{ height: '220px' }}><Pie data={getPieOrBarData('Turno')} options={pieOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Rol</h4><div style={{ height: '220px' }}><Bar data={getRolBarData()} options={commonBarOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Sexo</h4><div style={{ height: '220px' }}><Pie data={getPieOrBarData('Sexo')} options={pieOptions} /></div></div>
      </div>
    </div>
  );
}

// Estilos
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '18px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const summaryCardStyle: React.CSSProperties = { flex: 1, backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '1rem', fontWeight: 600 };
const kpiValueStyle: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 600, color: COLORS.celeste, margin: '10px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: '1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '8px' };