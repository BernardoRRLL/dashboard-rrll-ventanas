import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, PointElement, LineElement, Filler } from 'chart.js';

// Registramos los elementos necesarios para el gráfico de líneas con área
ChartJS.register(PointElement, LineElement, Filler);
ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  magenta: '#C2185B',
  magentaFondo: 'rgba(194, 24, 91, 0.2)',
  pieColors: ['#0098aa', '#e45302', '#f4ab03', '#36424a', '#4A90E2', '#8B9BB4']
};

interface ParticipacionFemeninaProps {
  rawData: any[];
}

export default function ParticipacionFemeninaTab({ rawData }: ParticipacionFemeninaProps) {
  
  // Filtrado ultra seguro para asegurar que pesque todas las filas de mujeres
  const womenData = rawData.filter(row => String(row['Sexo'] || '').trim() === 'F');
  
  // 1. Cálculos para los KPIs
  const totalDotacion = rawData.length;
  const totalMujeres = womenData.length;
  const porcentajeRep = totalDotacion > 0 ? ((totalMujeres / totalDotacion) * 100).toFixed(1) : "0";
  
  let sumaEdades = 0;
  let conEdad = 0;
  womenData.forEach(row => {
    const edad = Number(row['Edad']);
    if (edad > 0) { Shield: sumaEdades += edad; conEdad++; }
  });
  const edadPromedio = conEdad > 0 ? (sumaEdades / conEdad).toFixed(1) : "0";

  // 2. Distribución Etaria
  const getDistribucionEtaria = () => {
    const rangos: { [key: string]: number } = { 
      'Hasta 30': 0, '31 - 35': 0, '36 - 40': 0, '41 - 45': 0, 
      '46 - 50': 0, '51 - 55': 0, '56 - 60': 0, 'Más de 60': 0 
    };
    
    womenData.forEach(row => {
      const edad = Number(row['Edad']); 
      if (!edad) return;
      if (edad <= 30) rangos['Hasta 30']++; 
      else if (edad <= 35) rangos['31 - 35']++; 
      else if (edad <= 40) rangos['36 - 40']++; 
      else if (edad <= 45) rangos['41 - 45']++; 
      else if (edad <= 50) rangos['46 - 50']++; 
      else if (edad <= 55) rangos['51 - 55']++; 
      else if (edad <= 60) rangos['56 - 60']++; 
      else rangos['Más de 60']++;
    });

    if (rangos['Más de 60'] === 0) delete rangos['Más de 60'];

    return { 
      labels: Object.keys(rangos), 
      datasets: [{ label: 'Mujeres', data: Object.values(rangos), backgroundColor: COLORS.naranjo, borderRadius: 4 }] 
    };
  };

  // 3. Distribución por Turno
  const getDistribucionTurno = () => {
    const counts: { [key: string]: number } = {};
    womenData.forEach(row => {
      const val = row['Turno']?.trim() || 'No especificado';
      counts[val] = (counts[val] || 0) + 1;
    });
    return { 
      labels: Object.keys(counts), 
      datasets: [{ data: Object.values(counts), backgroundColor: COLORS.pieColors, borderWidth: 2, borderColor: COLORS.blanco }] 
    };
  };

  // 4. Distribución por Rol
  const getDistribucionRol = () => {
    const counts: { [key: string]: number } = {};
    womenData.forEach(row => {
      const val = row['Rol']?.trim() || 'No especificado';
      counts[val] = (counts[val] || 0) + 1;
    });
    
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { 
      labels: sortedKeys, 
      datasets: [{ label: 'Dotación', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.celeste, borderRadius: 4 }] 
    };
  };

  // 5. Evolución Histórica de Ingresos Femeninos (MÓDULO REPARADO E INTELIGENTE)
  const getEvolucionHistorica = () => {
    const years: { [key: string]: number } = {};
    
    womenData.forEach(row => {
      // Mapeo flexible de columnas de fecha habituales
      const fechaRaw = row['Fecha Ingreso'] || row['Fecha de Ingreso'] || row['Fecha Ingreso DVEN'] || row['Fecha de Ingeso a la Empresa'] || '';
      const fecha = String(fechaRaw).trim();
      if (!fecha) return;

      let year: string | null = null;

      // Caso A: Si Excel lo envía como Número de serie de 5 dígitos (Formato General sin fecha aplicada)
      if (/^\d{5}$/.test(fecha)) {
        const serial = parseInt(fecha, 10);
        try {
          const jsDate = new Date((serial - 25569) * 86400 * 1000);
          const fullYear = jsDate.getFullYear();
          if (fullYear >= 1950 && fullYear <= 2050) year = String(fullYear);
        } catch (e) {}
      }

      // Caso B: Si viene como texto estructurado (el escenario más común con raw: false)
      if (!year) {
        // 1. Buscar año explícito de 4 dígitos (19XX o 20XX)
        const match4 = fecha.match(/(19|20)\d{2}/);
        if (match4) {
          year = match4[0];
        } else {
          // 2. Buscar año abreviado de 2 dígitos al final (ej: DD/MM/YY o DD-MM-YY)
          const match2 = fecha.match(/[-/](\d{2})$/);
          if (match2) {
            const yy = parseInt(match2[1], 10);
            year = yy < 50 ? `20${match2[1]}` : `19${match2[1]}`; // Menor a 50 asume los 2000s, mayor asume los 1900s
          }
        }
      }

      if (year) {
        years[year] = (years[year] || 0) + 1;
      }
    });

    const sortedYears = Object.keys(years).sort();
    return {
      labels: sortedYears.length > 0 ? sortedYears : ['Sin datos estructurados'],
      datasets: [{
        label: 'Ingresos Femeninos',
        data: sortedYears.length > 0 ? sortedYears.map(y => years[y]) : [0],
        borderColor: COLORS.magenta,
        backgroundColor: COLORS.magentaFondo,
        fill: true,
        tension: 0.4, 
        pointBackgroundColor: COLORS.magenta,
        borderWidth: 2
      }]
    };
  };

  // 6. Distribución por Área
  const getDistribucionArea = () => {
    const counts: { [key: string]: number } = {};
    womenData.forEach(row => {
      const val = row['Gerencia / Superintendencia']?.trim() || 'Otra';
      counts[val] = (counts[val] || 0) + 1;
    });
    const sortedKeys = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return { 
      labels: sortedKeys, 
      datasets: [{ label: 'Mujeres', data: sortedKeys.map(k => counts[k]), backgroundColor: COLORS.naranjo, borderRadius: 4 }] 
    };
  };

  // --- Opciones de Gráficos ---
  const verticalBarOptions: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600 } } } };
  const horizontalBarOptions: any = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600 } } } };
  const lineOptions: any = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, datalabels: { align: 'top', color: COLORS.magenta, font: { weight: 600 } } }, scales: { y: { beginAtZero: true } } };
  const doughnutOptions: any = { responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom' }, datalabels: { color: COLORS.blanco, font: { weight: 600 } } } };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* Resumen Superior */}
      <div style={{ display: 'flex', gap: '25px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Mujeres en la Dotación</h4><p style={kpiValueStyle}>{totalMujeres}</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>% de Representación</h4><p style={kpiValueStyle}>{porcentajeRep}%</p></div>
        <div style={summaryCardStyle}><h4 style={kpiTitleStyle}>Edad Promedio</h4><p style={kpiValueStyle}>{edadPromedio}</p></div>
      </div>

      {/* Fila 1: Distribución Etaria y Turno */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución Etaria</h4><div style={{ height: '280px' }}><Bar data={getDistribucionEtaria()} options={verticalBarOptions} /></div></div>
        <div style={cardStyle}><h4 style={chartTitleStyle}>Distribución por Turno</h4><div style={{ height: '280px' }}><Doughnut data={getDistribucionTurno()} options={doughnutOptions} /></div></div>
      </div>

      {/* Fila 2: Distribución por Rol */}
      <div style={cardStyle}>
        <h4 style={chartTitleStyle}>Distribución por Rol</h4>
        <div style={{ height: '280px' }}><Bar data={getDistribucionRol()} options={horizontalBarOptions} /></div>
      </div>

      {/* Fila 3: Evolución Histórica */}
      <div style={cardStyle}>
        <h4 style={chartTitleStyle}>Evolución Histórica de Ingresos Femeninos</h4>
        <div style={{ height: '300px' }}><Line data={getEvolucionHistorica()} options={lineOptions} /></div>
      </div>

      {/* Fila 4: Distribución por Área */}
      <div style={cardStyle}>
        <h4 style={chartTitleStyle}>Distribución por Área</h4>
        <div style={{ height: '320px' }}><Bar data={getDistribucionArea()} options={horizontalBarOptions} /></div>
      </div>

    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const summaryCardStyle: React.CSSProperties = { flex: 1, backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '1rem', fontWeight: 600 };
const kpiValueStyle: React.CSSProperties = { fontSize: '2.5rem', fontWeight: 600, color: COLORS.naranjo, margin: '10px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' };