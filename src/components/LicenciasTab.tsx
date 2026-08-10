import React, { useState } from 'react';
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
  rojoInicio: '#E53935', // Rojo para el punto de inicio
  verdeFin: '#43A047',   // Verde para el punto de término
  pieColors: ['#C2185B', '#0098aa', '#f4ab03', '#e45302', '#36424a', '#8B9BB4', '#4A90E2', '#D0021B']
};

interface LicenciasProps {
  rawData: any[];
}

// Función para traducir dd-mmm-yyyy a un objeto Date de JavaScript
const parseCustomDate = (dateStr: string) => {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().toLowerCase().split('-');
  if (parts.length !== 3) return null;
  
  const [day, monthStr, year] = parts;
  // Diccionario de meses en español (y fallback en inglés por si acaso)
  const monthMap: Record<string, number> = {
    ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
    jan: 0, apr: 3, aug: 7, dec: 11
  };
  
  const monthIndex = monthMap[monthStr] !== undefined ? monthMap[monthStr] : parseInt(monthStr) - 1;
  return new Date(parseInt(year), monthIndex, parseInt(day));
};

export default function LicenciasTab({ rawData }: LicenciasProps) {
  // Estado para controlar la vista actual
  const [view, setView] = useState<'tablero' | 'calendario'>('tablero');
  // Estado para controlar el mes actual del calendario
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const licenciasData = rawData.filter(row => row['Rut'] && String(row['Rut']).trim() !== '');

  // --- CÁLCULOS PARA LOS KPIS SUPERIORES ---
  const totalLicencias = licenciasData.length;
  let totalDiasLicenciaActual = 0;
  let totalDias12Meses = 0; 
  let licenciasMayoresA100 = 0; 

  // Diccionarios para el calendario: clave "YYYY-M-D" -> Array de nombres
  const startsByDate: Record<string, string[]> = {};
  const endsByDate: Record<string, string[]> = {};

  licenciasData.forEach(row => {
    // 1. Cálculos de KPIs
    totalDiasLicenciaActual += Number(row['Días'] || row['Dias']) || 0;
    const dias12 = row['Días acumulados últimos 12 meses '] || row['Días acumulados últimos 12 meses'] || 0;
    totalDias12Meses += Number(dias12) || 0;
    const diasAcumulados = Number(row['Acum.'] || row['Acum'] || 0);
    if (diasAcumulados >= 100) {
      licenciasMayoresA100++;
    }

    // 2. Extracción de fechas para el Calendario
    const nombre = row['Nombre trabajador/a']?.trim() || 'Colaborador';
    const fInicio = row['Fecha de Inicio'];
    const fTermino = row['Fecha Termino'];

    if (fInicio) {
      const dInicio = parseCustomDate(fInicio);
      if (dInicio) {
        const key = `${dInicio.getFullYear()}-${dInicio.getMonth()}-${dInicio.getDate()}`;
        if (!startsByDate[key]) startsByDate[key] = [];
        startsByDate[key].push(nombre);
      }
    }
    
    if (fTermino) {
      const dTermino = parseCustomDate(fTermino);
      if (dTermino) {
        const key = `${dTermino.getFullYear()}-${dTermino.getMonth()}-${dTermino.getDate()}`;
        if (!endsByDate[key]) endsByDate[key] = [];
        endsByDate[key].push(nombre);
      }
    }
  });

  const promedioDias = totalLicencias > 0 ? (totalDiasLicenciaActual / totalLicencias).toFixed(1) : "0";

  // --- DATOS PARA GRÁFICOS (TABLERO) ---
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

  const datalabelConfig = { color: COLORS.blanco, font: { weight: 600, size: 9, family: "'Poppins', sans-serif" } };
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 9, family: "'Poppins', sans-serif" } } }, datalabels: datalabelConfig } };
  const horizontalBarOptions: any = { ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } };
  const verticalBarOptions: any = { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false }, datalabels: { ...datalabelConfig, anchor: 'end', align: 'start' } } };
  const doughnutOptions: any = { ...commonOptions, cutout: '65%', plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9, family: "'Poppins', sans-serif" } } } } };

  // --- LÓGICA DEL CALENDARIO VISUAL ---
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Ajuste para que la semana empiece en Lunes
    const firstDay = new Date(year, month, 1).getDay();
    const startingDayIndex = firstDay === 0 ? 6 : firstDay - 1; 

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    // Generar casillas vacías para los días antes del inicio del mes
    const emptyCells = Array.from({ length: startingDayIndex }).map((_, i) => <div key={`empty-${i}`} style={calendarCellEmpty}></div>);
    
    // Generar los días reales del mes
    const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const key = `${year}-${month}-${day}`;
      const starts = startsByDate[key] || [];
      const ends = endsByDate[key] || [];

      return (
        <div key={day} style={calendarCell}>
          <div style={calendarDayNumber}>{day}</div>
          <div style={dotsContainer}>
            {starts.length > 0 && (
              <div 
                style={{...dotStyle, backgroundColor: COLORS.rojoInicio}} 
                title={`INICIAN LICENCIA:\n${starts.join('\n')}`}
              >
                {starts.length > 1 && <span style={dotCount}>{starts.length}</span>}
              </div>
            )}
            {ends.length > 0 && (
              <div 
                style={{...dotStyle, backgroundColor: COLORS.verdeFin}} 
                title={`TERMINAN LICENCIA:\n${ends.join('\n')}`}
              >
                {ends.length > 1 && <span style={dotCount}>{ends.length}</span>}
              </div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div style={cardStyle}>
        {/* Cabecera del Calendario */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>◀ Anterior</button>
          <h3 style={{ margin: 0, color: COLORS.gris, fontWeight: 600 }}>{monthNames[month]} {year}</h3>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>Siguiente ▶</button>
        </div>
        
        {/* Leyenda */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', justifyContent: 'center', fontSize: '0.85rem', color: COLORS.gris }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{...dotStyle, backgroundColor: COLORS.rojoInicio, position: 'relative', transform: 'none'}}></div> Inicio de Licencia
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{...dotStyle, backgroundColor: COLORS.verdeFin, position: 'relative', transform: 'none'}}></div> Término de Licencia
          </div>
        </div>

        {/* Grilla */}
        <div style={calendarGrid}>
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} style={calendarHeaderDay}>{d}</div>
          ))}
          {emptyCells}
          {dayCells}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(15px, 3vw, 25px)', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 1. Resumen Superior */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'clamp(4px, 1.5vw, 20px)', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Licencias</h4><p style={kpiValueStyle}>{totalLicencias}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Días Acum.<br/>(Últimos 12 Meses)</h4><p style={{...kpiValueStyle, color: COLORS.naranjo}}>{totalDias12Meses}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>LM Mayores<br/>a 100 Días</h4><p style={{...kpiValueStyle, color: COLORS.rosado}}>{licenciasMayoresA100}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Promedio<br/>Días / Licencia</h4><p style={kpiValueStyle}>{promedioDias}</p></div>
      </div>

      {/* TABS DE NAVEGACIÓN INTERNA */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '-5px' }}>
        <button 
          onClick={() => setView('tablero')}
          style={{...tabButton, backgroundColor: view === 'tablero' ? COLORS.celeste : COLORS.blanco, color: view === 'tablero' ? COLORS.blanco : COLORS.gris}}
        >
          📊 Vista Tablero
        </button>
        <button 
          onClick={() => setView('calendario')}
          style={{...tabButton, backgroundColor: view === 'calendario' ? COLORS.celeste : COLORS.blanco, color: view === 'calendario' ? COLORS.blanco : COLORS.gris}}
        >
          📅 Vista Calendario
        </button>
      </div>

      {/* CONTENIDO DINÁMICO: Tablero de gráficos O Calendario */}
      {view === 'tablero' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(10px, 2vw, 20px)' }}>
          <div style={cardStyle}><h4 style={chartTitleStyle}>Cantidad de Licencias por Gerencia</h4><div style={{ width: '100%', height: '260px' }}><Bar data={getLicenciasPorGerencia()} options={horizontalBarOptions} /></div></div>
          <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Especialidad Médica</h4><div style={{ width: '100%', height: '260px' }}><Doughnut data={getEspecialidadData()} options={doughnutOptions} /></div></div>
          <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Grupo de Trabajo</h4><div style={{ width: '100%', height: '260px' }}><Bar data={getGrupoData()} options={verticalBarOptions} /></div></div>
          <div style={cardStyle}><h4 style={chartTitleStyle}>Análisis de Extensión (Nuevas vs Continuación)</h4><div style={{ width: '100%', height: '260px' }}><Bar data={getContinuacionData()} options={verticalBarOptions} /></div></div>
        </div>
      ) : (
        renderCalendar()
      )}
      
    </div>
  );
}

// --- ESTILOS GENERALES Y TABS ---
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: 'clamp(10px, 2vw, 20px)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
const summaryCardStyle: React.CSSProperties = { flex: 1, minWidth: 0, backgroundColor: COLORS.blanco, padding: 'clamp(8px, 1.5vw, 20px) clamp(2px, 0.5vw, 10px)', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: 'clamp(0.50rem, 1.3vw, 0.9rem)', fontWeight: 600, lineHeight: 1.2 };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1rem, 3.5vw, 2.2rem)', fontWeight: 600, color: COLORS.celeste, margin: '5px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: 'clamp(0.70rem, 1.8vw, 1.1rem)', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '8px', whiteSpace: 'normal', lineHeight: 1.2 };
const tabButton: React.CSSProperties = { padding: '8px 20px', borderRadius: '20px', border: `1px solid ${COLORS.celeste}`, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: "'Poppins', sans-serif" };

// --- ESTILOS DEL CALENDARIO NATIVO ---
const navButton: React.CSSProperties = { padding: '5px 15px', backgroundColor: 'transparent', border: `1px solid #ddd`, borderRadius: '4px', cursor: 'pointer', color: COLORS.gris, fontWeight: 600, fontFamily: "'Poppins', sans-serif" };
const calendarGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' };
const calendarHeaderDay: React.CSSProperties = { textAlign: 'center', fontWeight: 600, color: COLORS.gris, padding: '10px 0', borderBottom: '2px solid #eee' };
const calendarCell: React.CSSProperties = { minHeight: '80px', padding: '5px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s', cursor: 'default' };
const calendarCellEmpty: React.CSSProperties = { minHeight: '80px', backgroundColor: 'transparent' };
const calendarDayNumber: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#888', alignSelf: 'flex-end', marginBottom: 'auto' };
const dotsContainer: React.CSSProperties = { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px', gap: '5px' };
const dotStyle: React.CSSProperties = { width: '16px', height: '16px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' };
const dotCount: React.CSSProperties = { color: 'white', fontSize: '10px', fontWeight: 'bold' };
