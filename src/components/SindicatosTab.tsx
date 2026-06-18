import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js';

// Forzar Poppins en todos los gráficos
ChartJS.defaults.font.family = "'Poppins', sans-serif";

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff'
};

interface SindicatosProps {
  rawData: any[];
}

export default function SindicatosTab({ rawData }: SindicatosProps) {
  
  // 1. Cálculos Base (Enfocados en Rol B)
  const rolBData = rawData.filter(row => row['Rol']?.trim() === 'Rol B');
  const totalRolB = rolBData.length;

  const afiliadosRolB = rolBData.filter(row => {
    const af = row['Afiliación Sindical']?.trim();
    return af && af !== '-' && af !== 'No' && af !== 'Sin Sindicato' && af !== '';
  });
  
  const totalAfiliadosRolB = afiliadosRolB.length;
  const porcentajeAfiliacion = totalRolB > 0 ? ((totalAfiliadosRolB / totalRolB) * 100).toFixed(1) : "0";

  // 2. Identificar los Sindicatos dinámicamente y contar su volumen
  const unionCounts: { [key: string]: number } = {};
  rawData.forEach(row => {
    const af = row['Afiliación Sindical']?.trim();
    if (af && af !== '-' && af !== 'No' && af !== 'Sin Sindicato' && af !== '') {
      unionCounts[af] = (unionCounts[af] || 0) + 1;
    }
  });

  const topUnions = Object.keys(unionCounts).sort((a, b) => unionCounts[b] - unionCounts[a]);
  const union1 = topUnions[0] || 'Sindicato 1';
  const union2 = topUnions[1] || 'Sindicato 2';

  const countU1 = unionCounts[union1] || 0;
  const countU2 = unionCounts[union2] || 0;
  const pctU1 = totalRolB > 0 ? ((countU1 / totalRolB) * 100).toFixed(1) : "0";
  const pctU2 = totalRolB > 0 ? ((countU2 / totalRolB) * 100).toFixed(1) : "0";

  // 3. Funciones para Gráficos de Grupos
  const getGrupoData = (unionName: string, color: string) => {
    const counts: { [key: string]: number } = { 'Grupo 1': 0, 'Grupo 2': 0, 'Grupo 3': 0, 'Grupo 4': 0, 'Admin.': 0 };
    
    rawData.forEach(row => {
      if (row['Afiliación Sindical']?.trim() === unionName) {
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
        }

        if (counts[g] !== undefined) {
          counts[g]++;
        } else {
          counts[g] = 1;
        }
      }
    });

    return {
      labels: Object.keys(counts),
      datasets: [{ label: unionName, data: Object.values(counts), backgroundColor: color, borderRadius: 4 }]
    };
  };

  // 4. Gráfico Butterfly
  const getAreaButterflyData = () => {
    const counts: { [key: string]: { u1: number, u2: number } } = {};
    
    rawData.forEach(row => {
      const area = row['Gerencia / Superintendencia']?.trim();
      const u = row['Afiliación Sindical']?.trim();
      
      if (area && u && (u === union1 || u === union2)) {
        if (!counts[area]) counts[area] = { u1: 0, u2: 0 };
        if (u === union1) counts[area].u1--; 
        if (u === union2) counts[area].u2++; 
      }
    });
    
    const filteredAreas = Object.keys(counts).filter(area => counts[area].u1 < 0 || counts[area].u2 > 0);
    
    filteredAreas.sort((a, b) => (counts[b].u2 + Math.abs(counts[b].u1)) - (counts[a].u2 + Math.abs(counts[a].u1)));

    return {
      labels: filteredAreas,
      datasets: [
        { label: union1, data: filteredAreas.map(a => counts[a].u1), backgroundColor: COLORS.celeste, borderRadius: 4 },
        { label: union2, data: filteredAreas.map(a => counts[a].u2), backgroundColor: COLORS.naranjo, borderRadius: 4 }
      ]
    };
  };

  // --- Opciones de Gráficos (Ajustadas con fuentes fluidas) ---
  const verticalBarOptions: any = { 
    responsive: true, maintainAspectRatio: false, 
    plugins: { legend: { display: false }, datalabels: { color: COLORS.blanco, anchor: 'end', align: 'start', font: { weight: 600, size: 9, family: "'Poppins', sans-serif" } } } 
  };
  
  const butterflyOptions: any = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    scales: { x: { stacked: true, ticks: { callback: (val: number) => Math.abs(val) } }, y: { stacked: true } },
    plugins: { 
      legend: { position: 'bottom', labels: { font: { size: 10, family: "'Poppins', sans-serif" } } }, 
      tooltip: { callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${Math.abs(ctx.raw)}` } }, 
      datalabels: { color: COLORS.blanco, font: { weight: 600, size: 9, family: "'Poppins', sans-serif" }, formatter: (value: number) => value !== 0 ? Math.abs(value) : '' } 
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(15px, 3vw, 25px)', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 1. Resumen Superior (Inquebrantable en una línea) */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 'clamp(8px, 2vw, 25px)', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}>
            <h4 style={kpiTitleStyle}>Total Afiliados (Rol B)</h4>
            <p style={kpiValueStyle}>{totalAfiliadosRolB}</p>
        </div>
        <div style={summaryCardStyle}>
            <h4 style={kpiTitleStyle}>% Afiliación (Rol B)</h4>
            <p style={kpiValueStyle}>{porcentajeAfiliacion}%</p>
        </div>
      </div>

      {/* 2. Resumen por Sindicato (1 fila por Sindicato) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div style={{ ...unionCardStyle, border: `2px solid ${COLORS.celeste}` }}>
          <div>
            <h3 style={{ margin: 0, color: COLORS.gris, fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>{union1}</h3>
            <p style={{ margin: 0, color: '#888', fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}>{pctU1}% de Rol B</p>
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 700, color: COLORS.celeste }}>{countU1}</div>
        </div>
        
        <div style={{ ...unionCardStyle, border: `2px solid ${COLORS.naranjo}` }}>
          <div>
            <h3 style={{ margin: 0, color: COLORS.gris, fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>{union2}</h3>
            <p style={{ margin: 0, color: '#888', fontSize: 'clamp(0.7rem, 2vw, 0.9rem)' }}>{pctU2}% de Rol B</p>
          </div>
          <div style={{ fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', fontWeight: 700, color: COLORS.naranjo }}>{countU2}</div>
        </div>
      </div>

      {/* 3. Composición por Grupos (Estricto: 2 por línea) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'clamp(10px, 2vw, 20px)' }}>
        <div style={cardStyle}>
            <h4 style={chartTitleStyle}>Composición por Grupos — {union1}</h4>
            <div style={{ width: '100%', height: '260px' }}><Bar data={getGrupoData(union1, COLORS.celeste)} options={verticalBarOptions} /></div>
        </div>
        <div style={cardStyle}>
            <h4 style={chartTitleStyle}>Composición por Grupos — {union2}</h4>
            <div style={{ width: '100%', height: '260px' }}><Bar data={getGrupoData(union2, COLORS.naranjo)} options={verticalBarOptions} /></div>
        </div>
      </div>

      {/* 4. Butterfly Chart (Fila completa, 100% ancho) */}
      <div style={cardStyle}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '8px', marginBottom: '15px' }}>
            <h4 style={{ margin: 0, color: COLORS.gris, fontSize: 'clamp(0.85rem, 2vw, 1.1rem)', fontWeight: 600 }}>Distribución por Área de Trabajo</h4>
            <div style={{ fontSize: 'clamp(0.65rem, 1.5vw, 0.9rem)', color: '#666', marginTop: '5px' }}>
              <span style={{color: COLORS.celeste, fontWeight: 600}}>■ {union1}</span> &nbsp;&nbsp;|&nbsp;&nbsp; <span style={{color: COLORS.naranjo, fontWeight: 600}}>■ {union2}</span>
            </div>
        </div>
        <div style={{ width: '100%', height: '350px' }}>
            <Bar data={getAreaButterflyData()} options={butterflyOptions} />
        </div>
      </div>

    </div>
  );
}

// Estilos fluidos y elásticos con minWidth: 0
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: 'clamp(10px, 2vw, 20px)', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
const summaryCardStyle: React.CSSProperties = { flex: 1, minWidth: 0, backgroundColor: COLORS.blanco, padding: 'clamp(10px, 2vw, 25px) clamp(5px, 1vw, 15px)', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center' };
const unionCardStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.blanco, padding: 'clamp(10px, 3vw, 15px) clamp(15px, 4vw, 30px)', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.03)', minWidth: 0 };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: 'clamp(0.6rem, 2vw, 1.1rem)', fontWeight: 600, lineHeight: 1.2 };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.5rem, 5vw, 2.8rem)', fontWeight: 600, color: COLORS.gris, margin: '8px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 15px 0', color: COLORS.gris, fontSize: 'clamp(0.75rem, 2vw, 1.1rem)', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '8px', whiteSpace: 'normal', lineHeight: 1.2 };
