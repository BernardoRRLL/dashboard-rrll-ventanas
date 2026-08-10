import React, { useState, useMemo } from 'react';
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
  rojoInicio: '#E53935', 
  verdeFin: '#43A047',   
  pieColors: ['#C2185B', '#0098aa', '#f4ab03', '#e45302', '#36424a', '#8B9BB4', '#4A90E2', '#D0021B']
};

interface LicenciasProps {
  rawData: any[];
  dotacionData: any[];
}

// --- TRADUCTOR DE FECHAS TODOTERRENO ---
const parseCustomDate = (dateVal: any) => {
  if (!dateVal) return null;

  if (typeof dateVal === 'number' || (!isNaN(Number(dateVal)) && Number(dateVal) > 10000)) {
    const serial = Number(dateVal);
    const jsDate = new Date(Math.round((serial - 25569) * 86400 * 1000));
    return new Date(jsDate.getUTCFullYear(), jsDate.getUTCMonth(), jsDate.getUTCDate(), 0, 0, 0);
  }

  const dateStr = String(dateVal).trim().toLowerCase().replace(/\//g, '-');
  const parts = dateStr.split('-');

  if (parts.length === 3) {
    let [dayStr, monthStr, yearStr] = parts;
    
    let parsedDay = parseInt(dayStr);
    let parsedYear = parseInt(yearStr);

    if (parsedDay > 1000) {
      const temp = parsedYear;
      parsedYear = parsedDay;
      parsedDay = temp;
    }

    if (parsedYear < 100) {
      parsedYear += parsedYear > 50 ? 1900 : 2000;
    }

    const monthMap: Record<string, number> = {
      ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5, jul: 6, ago: 7, sep: 8, oct: 9, nov: 10, dic: 11,
      jan: 0, apr: 3, aug: 7, dec: 11
    };
    
    const cleanMonthStr = monthStr.replace(/[^a-z]/g, '');
    let monthIndex = -1;
    
    if (cleanMonthStr && monthMap[cleanMonthStr] !== undefined) {
      monthIndex = monthMap[cleanMonthStr];
    } else {
      monthIndex = parseInt(monthStr) - 1;
    }

    if (!isNaN(parsedYear) && !isNaN(monthIndex) && monthIndex >= 0 && monthIndex <= 11 && !isNaN(parsedDay)) {
      return new Date(parsedYear, monthIndex, parsedDay, 0, 0, 0);
    }
  }

  const fallbackDate = new Date(dateVal);
  if (!isNaN(fallbackDate.getTime())) {
    return new Date(fallbackDate.getFullYear(), fallbackDate.getMonth(), fallbackDate.getDate(), 0, 0, 0);
  }

  return null;
};

export default function LicenciasTab({ rawData, dotacionData }: LicenciasProps) {
  const [view, setView] = useState<'tablero' | 'calendario'>('tablero');
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  const licenciasData = useMemo(() => rawData.filter(row => row['Rut'] && String(row['Rut']).trim() !== ''), [rawData]);

  // --- DICCIONARIO MAESTRO (DOTACIÓN) ---
  const dotacionDict = useMemo(() => {
    const dict: Record<string, any> = {};
    if (dotacionData) {
      dotacionData.forEach(row => {
        const rut = String(row['Rut'] || row['SAP'] || '').trim().toLowerCase();
        const nombre = String(row['Nombre'] || row['Nombre trabajador/a'] || '').trim().toLowerCase();
        if (rut) dict[rut] = row;
        if (nombre) dict[nombre] = row; 
      });
    }
    return dict;
  }, [dotacionData]);

  // --- CÁLCULOS SUPERIORES Y PROCESAMIENTO ---
  const totalLicencias = licenciasData.length;
  let totalDiasLicenciaActual = 0;
  let totalDias12Meses = 0; 
  let licenciasMayoresA100 = 0; 

  const startsByDate: Record<string, string[]> = {};
  const endsByDate: Record<string, string[]> = {};
  
  // --- LÓGICA DEL RADAR DE REINTEGROS ---
  const upcomingReturns: { nombre: string, fecha: Date, cargo: string, area: string, grupo: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0); 
  
  const limitDate = new Date(today);
  limitDate.setDate(today.getDate() + 7); 

  licenciasData.forEach(row => {
    totalDiasLicenciaActual += Number(row['Días'] || row['Dias']) || 0;
    const dias12 = row['Días acumulados últimos 12 meses '] || row['Días acumulados últimos 12 meses'] || 0;
    totalDias12Meses += Number(dias12) || 0;
    const diasAcumulados = Number(row['Acum.'] || row['Acum'] || 0);
    if (diasAcumulados >= 100) licenciasMayoresA100++;

    // Búsqueda en el maestro
    const rutVal = String(row['Rut'] || row['SAP'] || '').trim().toLowerCase();
    const nombreVal = String(row['Nombre trabajador/a'] || '').trim().toLowerCase();
    const empleadoMaestro = dotacionDict[rutVal] || dotacionDict[nombreVal] || null;

    const nombre = row['Nombre trabajador/a']?.trim() || 'Colaborador';
    
    // Extracción inteligente: Apuntamos directamente a "Posición"
    const cargo = empleadoMaestro ? (empleadoMaestro['Posición']?.trim() || empleadoMaestro['Posicion']?.trim() || 'Sin Posición') : (row['Posición']?.trim() || row['Posicion']?.trim() || 'Sin Posición');
    const area = empleadoMaestro ? (empleadoMaestro['Gerencia / Superintendencia']?.trim() || empleadoMaestro['Superintendencia / Dirección / Gerencia']?.trim() || 'Sin Área') : (row['Superintendencia / Dirección / Gerencia']?.trim() || 'Sin Área');
    
    let rawGrupo = empleadoMaestro ? (empleadoMaestro['Grupo']?.trim()) : row['Grupo']?.trim();
    if (!rawGrupo) rawGrupo = 'Admin.';
    
    let grupo = rawGrupo;
    if (grupo === '-' || grupo.toLowerCase().includes('admin')) grupo = 'Admin.';
    else if (['1', 'Grupo 1'].includes(grupo)) grupo = 'Grupo 1';
    else if (['2', 'Grupo 2'].includes(grupo)) grupo = 'Grupo 2';
    else if (['3', 'Grupo 3'].includes(grupo)) grupo = 'Grupo 3';
    else if (['4', 'Grupo 4'].includes(grupo)) grupo = 'Grupo 4';
    else grupo = 'Admin.';

    const fInicio = row['Fecha de Inicio'];
    const fTermino = row['Fecha Termino'];

    if (fInicio) {
      const dInicio = parseCustomDate(fInicio);
      if (dInicio) {
        const key = `${dInicio.getFullYear()}-${String(dInicio.getMonth() + 1).padStart(2, '0')}-${String(dInicio.getDate()).padStart(2, '0')}`;
        if (!startsByDate[key]) startsByDate[key] = [];
        startsByDate[key].push(nombre);
      }
    }
    
    if (fTermino) {
      const dTermino = parseCustomDate(fTermino);
      if (dTermino) {
        const key = `${dTermino.getFullYear()}-${String(dTermino.getMonth() + 1).padStart(2, '0')}-${String(dTermino.getDate()).padStart(2, '0')}`;
        if (!endsByDate[key]) endsByDate[key] = [];
        endsByDate[key].push(nombre);

        if (dTermino >= today && dTermino <= limitDate) {
          upcomingReturns.push({ nombre, fecha: dTermino, cargo, area, grupo });
        }
      }
    }
  });

  upcomingReturns.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());

  const promedioDias = totalLicencias > 0 ? (totalDiasLicenciaActual / totalLicencias).toFixed(1) : "0";

  // --- DATOS PARA GRÁFICOS (TABLERO) ---
  const getLicenciasPorGerencia = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      const g = row['Superintendencia / Dirección / Gerencia']?.trim() || 'No especificada';
      counts[g] = (counts[g] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { labels: sortedKeys, datasets: [{ label: 'Cantidad', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.celeste, borderRadius: 4 }] };
  };

  const getEspecialidadData = () => {
    const counts: { [key: string]: number } = {};
    licenciasData.forEach(row => {
      let esp = row['Especialidad']?.trim() || 'No especificada';
      if (esp === '') esp = 'No especificada';
      counts[esp] = (counts[esp] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { labels: sortedKeys, datasets: [{ data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.pieColors, borderWidth: 2, borderColor: COLORS.blanco }] };
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
    return { labels: Object.keys(counts), datasets: [{ label: 'Licencias', data: Object.values(counts), backgroundColor: COLORS.naranjo, borderRadius: 4 }] };
  };

  const getContinuacionData = () => {
    const counts: { [key: string]: number } = { 'Nueva': 0, 'Continuación': 0 };
    licenciasData.forEach(row => {
      const ext = row['Continuación']?.trim() || 'Nueva';
      if (ext.toLowerCase().includes('continua')) counts['Continuación']++;
      else counts['Nueva']++;
    });
    return { labels: Object.keys(counts), datasets: [{ label: 'Cantidad', data: Object.values(counts), backgroundColor: [COLORS.celeste, COLORS.rosado], borderRadius: 4 }] };
  };

  const datalabelConfig = { color: COLORS.blanco, font: { weight: 600, size: 9, family: "'Poppins', sans-serif" } };
  const commonOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' as const, labels: { font: { size: 9, family: "'Poppins', sans-serif" } } }, datalabels: datalabelConfig } };
  const horizontalBarOptions: any = { ...commonOptions, indexAxis: 'y', plugins: { ...commonOptions.plugins, legend: { display: false } } };
  const verticalBarOptions: any = { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: false }, datalabels: { ...datalabelConfig, anchor: 'end', align: 'start' } } };
  const doughnutOptions: any = { ...commonOptions, cutout: '65%', plugins: { ...commonOptions.plugins, legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9, family: "'Poppins', sans-serif" } } } } };

  // --- LÓGICA DEL CALENDARIO ---
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const emptyDaysCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const emptyCells = Array.from({ length: emptyDaysCount }).map((_, i) => (
      <div key={`empty-${i}`} style={calendarCellEmpty}></div>
    ));
    
    const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const day = i + 1;
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
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
      <div className="licencias-calendar-layout">
        
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <button style={navButton} onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>◀ Anterior</button>
            <h3 style={{ margin: 0, color: COLORS.gris, fontWeight: 600 }}>{monthNames[month]} {year}</h3>
            <button style={navButton} onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>Siguiente ▶</button>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', justifyContent: 'center', fontSize: '0.85rem', color: COLORS.gris }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{...dotStyle, backgroundColor: COLORS.rojoInicio, position: 'relative', transform: 'none'}}></div> Inicio
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{...dotStyle, backgroundColor: COLORS.verdeFin, position: 'relative', transform: 'none'}}></div> Término
            </div>
          </div>

          <div style={calendarGrid}>
            {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
              <div key={d} style={calendarHeaderDay}>{d}</div>
            ))}
            {emptyCells}
            {dayCells}
          </div>
        </div>

        {/* LADO DERECHO: LISTA DE REINTEGROS AMPLIADA */}
        <div style={{ ...cardStyle, backgroundColor: 'transparent', boxShadow: 'none', padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <div style={{ color: COLORS.naranjo }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 }}>
              Próximos 7 Días
            </h4>
            <span style={{ marginLeft: 'auto', backgroundColor: '#E0F7FA', color: COLORS.celeste, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
              {upcomingReturns.length}
            </span>
          </div>
          
          {upcomingReturns.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '550px', overflowY: 'auto', paddingRight: '5px' }}>
              {upcomingReturns.map((ret, idx) => {
                const isToday = ret.fecha.getTime() === today.getTime();
                const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                
                return (
                  <div key={idx} style={{ 
                    display: 'flex', 
                    backgroundColor: COLORS.blanco, 
                    borderRadius: '8px', 
                    overflow: 'hidden', 
                    border: isToday ? `2px solid ${COLORS.verdeFin}` : '1px solid #eee', 
                    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                    minHeight: '110px' 
                  }}>
                    <div style={{ 
                      backgroundColor: isToday ? COLORS.verdeFin : COLORS.celeste, 
                      color: COLORS.blanco, 
                      padding: '15px 10px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      minWidth: '85px' 
                    }}>
                      <span style={{ fontSize: '1.8rem', fontWeight: 700, lineHeight: 1 }}>{ret.fecha.getDate()}</span>
                      <span style={{ fontSize: '0.90rem', textTransform: 'uppercase', fontWeight: 600, marginTop: '2px' }}>{months[ret.fecha.getMonth()]}</span>
                    </div>
                    
                    <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <h5 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: COLORS.gris, fontWeight: 700, lineHeight: 1.2 }}>{ret.nombre}</h5>
                      <p style={{ margin: '0 0 2px 0', fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>{ret.cargo}</p>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: COLORS.naranjo, fontWeight: 600 }}>{ret.area}</p>
                      
                      <div style={{ marginTop: 'auto' }}>
                        <span style={{ 
                          display: 'inline-block', 
                          padding: '3px 10px', 
                          backgroundColor: isToday ? '#E8F5E9' : '#f0f4f8', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700, 
                          color: isToday ? COLORS.verdeFin : COLORS.celeste 
                        }}>
                          {ret.grupo}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ ...cardStyle, textAlign: 'center', color: '#888', fontStyle: 'italic', padding: '30px 20px' }}>
              No hay retornos programados para los próximos días.
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(15px, 3vw, 25px)', fontFamily: "'Poppins', sans-serif" }}>
      
      <style>{`
        .licencias-calendar-layout {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 25px;
          align-items: start;
        }
        @media (max-width: 900px) {
          .licencias-calendar-layout {
            display: flex;
            flex-direction: column-reverse;
          }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 'clamp(-10px, -4vw, -45px)', position: 'relative', zIndex: 10 }}>
        <button 
          onClick={() => setView('tablero')}
          style={{...tabButton, backgroundColor: view === 'tablero' ? COLORS.celeste : COLORS.blanco, color: view === 'tablero' ? COLORS.blanco : COLORS.gris}}
        >
          Tableros
        </button>
        <button 
          onClick={() => setView('calendario')}
          style={{...tabButton, backgroundColor: view === 'calendario' ? COLORS.celeste : COLORS.blanco, color: view === 'calendario' ? COLORS.blanco : COLORS.gris}}
        >
          Calendario
        </button>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(10px, 1.5vw, 20px)', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Licencias</h4><p style={kpiValueStyle}>{totalLicencias}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Días Acum.<br/>(Últimos 12)</h4><p style={{...kpiValueStyle, color: COLORS.naranjo}}>{totalDias12Meses}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>LM Mayores<br/>a 100 Días</h4><p style={{...kpiValueStyle, color: COLORS.rosado}}>{licenciasMayoresA100}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Promedio<br/>Días / Licencia</h4><p style={kpiValueStyle}>{promedioDias}</p></div>
      </div>

      {view === 'tablero' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: 'clamp(10px, 2vw, 20px)' }}>
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

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: 'clamp(10px, 2vw, 20px)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 0, backgroundColor: COLORS.blanco, padding: 'clamp(6px, 1.2vw, 15px) clamp(2px, 0.5vw, 10px)', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '80px' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: 'clamp(0.55rem, 1.2vw, 0.9rem)', fontWeight: 600, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 3vw, 2.2rem)', fontWeight: 600, color: COLORS.celeste, margin: '5px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: 'clamp(0.70rem, 1.8vw, 1.1rem)', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '8px', whiteSpace: 'normal', lineHeight: 1.2 };
const tabButton: React.CSSProperties = { padding: '6px 18px', borderRadius: '8px', border: `1px solid ${COLORS.celeste}`, fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', transition: 'all 0.3s ease', fontFamily: "'Poppins', sans-serif" };

const navButton: React.CSSProperties = { padding: '5px 15px', backgroundColor: 'transparent', border: `1px solid #ddd`, borderRadius: '4px', cursor: 'pointer', color: COLORS.gris, fontWeight: 600, fontFamily: "'Poppins', sans-serif" };
const calendarGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px' };
const calendarHeaderDay: React.CSSProperties = { textAlign: 'center', fontWeight: 600, color: COLORS.gris, padding: '10px 0', borderBottom: '2px solid #eee', fontSize: '0.9rem' };
const calendarCell: React.CSSProperties = { minHeight: '75px', padding: '5px', border: '1px solid #eee', borderRadius: '4px', backgroundColor: '#fafafa', display: 'flex', flexDirection: 'column', transition: 'background-color 0.2s', cursor: 'default' };
const calendarCellEmpty: React.CSSProperties = { minHeight: '75px', backgroundColor: 'transparent' };
const calendarDayNumber: React.CSSProperties = { fontSize: '0.85rem', fontWeight: 600, color: '#888', alignSelf: 'flex-end', marginBottom: 'auto' };
const dotsContainer: React.CSSProperties = { display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '10px', gap: '5px' };
const dotStyle: React.CSSProperties = { width: '14px', height: '14px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform 0.2s' };
const dotCount: React.CSSProperties = { color: 'white', fontSize: '9px', fontWeight: 'bold' };
