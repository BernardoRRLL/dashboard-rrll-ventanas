import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import ChartJSPluginDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartJSPluginDataLabels);
ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff'
};

export default function AusentismoTab({ rawData }: { rawData: any[][] }) {
  
  const parsePercent = (val: any) => {
    const str = String(val).trim().replace(',', '.');
    if (str.includes('%')) return parseFloat(str.replace('%', ''));
    return parseFloat(str) * 100;
  };

  const getRowData = (keyword: string, occurrence = 1) => {
    const rows = rawData.filter(r => r.some(cell => String(cell).trim() === keyword));
    const targetRow = rows[occurrence - 1];
    if (!targetRow) return [];
    const idx = targetRow.findIndex(cell => String(cell).trim() === keyword);
    const values = [];
    for (let i = idx + 1; i <= idx + 12; i++) {
        if (targetRow[i] !== undefined && targetRow[i] !== "") {
            const val = parsePercent(targetRow[i]);
            if (!isNaN(val)) values.push(val);
        }
    }
    return values;
  };

  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const proyectadoTotal = getRowData('Total', 1);
  const realAcumulado = getRowData('Real', 1);

  const areas = ['Mantenimiento', 'Refino a Fuego', 'Refineria', 'Staff'];
  const ausentismoData = areas.map(area => {
    const vals = getRowData(area, 1);
    return { area, lm: vals[0] || 0, permisos: vals[1] || 0 };
  });

  const sobretiempoData = areas.map(area => {
    const vals = getRowData(area, 2); 
    return { area, valor: vals[0] || 0 };
  });

  const tipoST_Valor = getRowData('Sobretiempo', 2)[0] || 0; 
  const tipoInt_Valor = getRowData('Interrupcion de descanso', 1)[0] || 0;

  const totalLicencias = ausentismoData.reduce((sum, item) => sum + item.lm, 0);
  const totalPermisos = ausentismoData.reduce((sum, item) => sum + item.permisos, 0);
  const totalSobretiempoArea = sobretiempoData.reduce((sum, item) => sum + item.valor, 0);

  const getEvolucionData = () => ({
    labels: meses,
    datasets: [
      { label: 'Ausentismo Real', data: realAcumulado, borderColor: COLORS.naranjo, backgroundColor: 'rgba(228, 83, 2, 0.2)', fill: true, tension: 0.4, borderWidth: 3, pointBackgroundColor: COLORS.naranjo },
      { label: 'Proyectado 2026 (Total)', data: proyectadoTotal, borderColor: COLORS.gris, borderDash: [5, 5], fill: false, tension: 0.4, borderWidth: 2, pointBackgroundColor: COLORS.gris }
    ]
  });

  const getAusentismoArea = () => ({
    labels: areas,
    datasets: [
      { label: 'Licencias Médicas (LM)', data: ausentismoData.map(d => d.lm), backgroundColor: COLORS.celeste, borderRadius: 4 },
      { label: 'Permisos', data: ausentismoData.map(d => d.permisos), backgroundColor: COLORS.amarillo, borderRadius: 4 }
    ]
  });

  const getSobretiempoArea = () => ({
    labels: areas,
    datasets: [{ label: '% Sobretiempo', data: sobretiempoData.map(d => d.valor), backgroundColor: COLORS.rosado, borderRadius: 4 }]
  });

  const getTipoSobretiempo = () => ({
    labels: ['Extensión de Jornada', 'Interrupción de Descanso'],
    datasets: [{ data: [tipoST_Valor, tipoInt_Valor], backgroundColor: [COLORS.rosado, COLORS.gris], borderWidth: 2, borderColor: COLORS.blanco }]
  });

  const formatLabel = (val: number) => val !== 0 ? val.toFixed(2) + '%' : '';
  const optionsBase = { responsive: true, maintainAspectRatio: false };
  const lineOptions: any = { ...optionsBase, plugins: { legend: { position: 'bottom' }, datalabels: { align: 'top', color: COLORS.gris, font: { weight: 600 }, formatter: formatLabel } } };
  const stackedBarOptions: any = { ...optionsBase, scales: { x: { stacked: true }, y: { stacked: true } }, plugins: { legend: { position: 'bottom' }, datalabels: { color: COLORS.blanco, font: { weight: 600 }, formatter: formatLabel } } };
  const barOptions: any = { ...optionsBase, plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600 }, formatter: formatLabel } } };
  const doughnutOptions: any = { ...optionsBase, cutout: '65%', plugins: { legend: { position: 'bottom' }, datalabels: { color: COLORS.blanco, font: { weight: 600 }, formatter: formatLabel } } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Licencias</h4><p style={{...kpiValueStyle, color: COLORS.celeste}}>{totalLicencias.toFixed(2)}%</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Permisos</h4><p style={{...kpiValueStyle, color: COLORS.amarillo}}>{totalPermisos.toFixed(2)}%</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Sobretiempo</h4><p style={{...kpiValueStyle, color: COLORS.rosado}}>{totalSobretiempoArea.toFixed(2)}%</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        <div style={cardStyle}>
          <h4 style={chartTitleStyle}>Evolución 2026: Ausentismo Proyectado vs Real</h4>
          <div style={{ width: '100%', height: '320px' }}><Line data={getEvolucionData()} options={lineOptions} /></div>
        </div>
        <div style={cardStyle}>
          <h4 style={chartTitleStyle}>Ausentismo Actual por Área</h4>
          <div style={{ width: '100%', height: '320px' }}><Bar data={getAusentismoArea()} options={stackedBarOptions} /></div>
        </div>
        <div style={cardStyle}>
          <h4 style={chartTitleStyle}>Sobretiempo por Área</h4>
          <div style={{ width: '100%', height: '280px' }}><Bar data={getSobretiempoArea()} options={barOptions} /></div>
        </div>
        <div style={cardStyle}>
          <h4 style={chartTitleStyle}>Tipo de Sobretiempo</h4>
          <div style={{ width: '100%', height: '280px' }}><Doughnut data={getTipoSobretiempo()} options={doughnutOptions} /></div>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 250px', backgroundColor: COLORS.blanco, padding: '25px 15px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 };
const kpiValueStyle: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 600, margin: '10px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' };
