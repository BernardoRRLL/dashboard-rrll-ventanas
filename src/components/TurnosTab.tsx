import React, { useState } from 'react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  fondo: '#f5f7f8'
};

export default function TurnosTab() {
  const [tipoTurno, setTipoTurno] = useState<'modificado' | 'lineal'>('modificado');
  // Arrancamos en enero 2026 para cuadrar con el PDF
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 1));
  const [highlightGroup, setHighlightGroup] = useState<number | null>(null);

  // --- MOTOR MATEMÁTICO DE TURNOS ---
  // Fecha semilla referencial (Ajustaremos esta fecha exacta con tu feedback)
  const fechaSemilla = new Date(2026, 0, 1); 

  const getShift = (date: Date, groupIndex: number, tipo: 'modificado' | 'lineal') => {
    // Calculamos la diferencia en días desde la semilla
    const diffTime = date.getTime() - fechaSemilla.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    if (tipo === 'modificado') {
      // Ciclo de 16 días: 4 Día (0-3), 4 Descanso (4-7), 4 Noche (8-11), 4 Descanso (12-15)
      // Cada grupo va desfasado por 4 días
      const offset = groupIndex * 4;
      const dayInCycle = ((diffDays - offset) % 16 + 16) % 16;
      
      if (dayInCycle < 4) return 'Día';
      if (dayInCycle < 8) return 'Descanso';
      if (dayInCycle < 12) return 'Noche';
      return 'Descanso';
    } else {
      // Lineal - Ciclo de 8 días: 4 Trabajo (0-3), 4 Descanso (4-7)
      const offset = groupIndex * 4;
      const dayInCycle = ((diffDays - offset) % 8 + 8) % 8;
      
      if (dayInCycle < 4) return 'Día';
      return 'Descanso';
    }
  };

  const getGroupsForDate = (date: Date, tipo: 'modificado' | 'lineal') => {
    const totalGroups = tipo === 'modificado' ? 4 : 2;
    const result = { dia: [] as string[], noche: [] as string[], descanso: [] as string[] };
    
    for (let i = 0; i < totalGroups; i++) {
      const groupName = tipo === 'modificado' ? `Grupo ${i + 1}` : `Grupo ${i === 0 ? '1' : '2'}`;
      const shift = getShift(date, i, tipo);
      
      if (shift === 'Día') result.dia.push(groupName);
      else if (shift === 'Noche') result.noche.push(groupName);
      else result.descanso.push(groupName);
    }
    return result;
  };

  // --- RENDERIZADO DEL CALENDARIO ---
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const emptyDaysCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const emptyCells = Array.from({ length: emptyDaysCount }).map((_, i) => (
      <div key={`empty-${i}`} style={{ minHeight: '80px', backgroundColor: 'transparent' }}></div>
    ));
    
    const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const currentDay = new Date(year, month, i + 1);
      const isSelected = currentDay.getTime() === selectedDate.getTime();
      
      // Lógica de colores si hay un grupo seleccionado
      let bgColor = '#fafafa';
      let textColor = '#888';
      let shiftLabel = '';
      
      if (highlightGroup !== null) {
        const shift = getShift(currentDay, highlightGroup, tipoTurno);
        if (shift === 'Día') { bgColor = '#FFE0B2'; textColor = COLORS.naranjo; shiftLabel = '☀️ Día'; }
        else if (shift === 'Noche') { bgColor = '#B2EBF2'; textColor = COLORS.celeste; shiftLabel = '🌙 Noche'; }
        else { bgColor = '#F5F5F5'; textColor = '#aaa'; shiftLabel = 'Descanso'; }
      }

      return (
        <div 
          key={i} 
          onClick={() => setSelectedDate(currentDay)}
          style={{ 
            minHeight: '80px', padding: '8px', border: isSelected ? `2px solid ${COLORS.naranjo}` : '1px solid #eee', 
            borderRadius: '6px', backgroundColor: isSelected ? '#fff' : bgColor, 
            display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: isSelected ? '0 4px 8px rgba(228, 83, 2, 0.2)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'none', zIndex: isSelected ? 2 : 1
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? COLORS.naranjo : textColor }}>{i + 1}</div>
          {highlightGroup !== null && (
            <div style={{ marginTop: 'auto', fontSize: '0.75rem', fontWeight: 600, color: textColor, textAlign: 'center' }}>
              {shiftLabel}
            </div>
          )}
        </div>
      );
    });

    return (
      <div style={{ backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>◀ Anterior</button>
          <h3 style={{ margin: 0, color: COLORS.gris, fontSize: '1.3rem', fontWeight: 700 }}>{monthNames[month]} {year}</h3>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>Siguiente ▶</button>
        </div>
        
        {/* Selector de Ruta (Grupo) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
          <button 
            onClick={() => setHighlightGroup(null)}
            style={{...filterButton, backgroundColor: highlightGroup === null ? COLORS.gris : '#f0f0f0', color: highlightGroup === null ? COLORS.blanco : '#666'}}
          >
            Vista General
          </button>
          {Array.from({ length: tipoTurno === 'modificado' ? 4 : 2 }).map((_, i) => (
            <button 
              key={i} onClick={() => setHighlightGroup(i)}
              style={{...filterButton, backgroundColor: highlightGroup === i ? COLORS.celeste : '#f0f0f0', color: highlightGroup === i ? COLORS.blanco : '#666'}}
            >
              Ruta {tipoTurno === 'modificado' ? `Grupo ${i + 1}` : `Grupo ${i === 0 ? '1' : '2'}`}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700, color: COLORS.gris, paddingBottom: '10px', borderBottom: '2px solid #eee' }}>{d}</div>
          ))}
          {emptyCells}
          {dayCells}
        </div>
      </div>
    );
  };

  // --- RENDERIZADO DEL PANEL DERECHO (FOTO DEL DÍA) ---
  const renderPanelDia = () => {
    const dataDelDia = getGroupsForDate(selectedDate, tipoTurno);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = selectedDate.toLocaleDateString('es-CL', options);

    return (
      <div style={{ backgroundColor: COLORS.blanco, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column' }}>
        <h4 style={{ margin: '0 0 5px 0', color: COLORS.naranjo, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>Foto Operativa</h4>
        <h2 style={{ margin: '0 0 25px 0', color: COLORS.gris, fontSize: '1.4rem', fontWeight: 700, textTransform: 'capitalize', borderBottom: '2px solid #eee', paddingBottom: '15px' }}>
          {fechaFormateada}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {/* Turno Día */}
          <div style={{ ...statusCard, borderLeft: `5px solid ${COLORS.naranjo}`, backgroundColor: '#FFF3E0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>☀️</span>
              <h5 style={{ margin: 0, color: COLORS.naranjo, fontSize: '1.1rem' }}>Turno de Día</h5>
            </div>
            <p style={{ margin: 0, fontWeight: 700, color: COLORS.gris, fontSize: '1.2rem' }}>
              {dataDelDia.dia.length > 0 ? dataDelDia.dia.join(' y ') : 'Sin grupo asignado'}
            </p>
          </div>

          {/* Turno Noche (Solo en Modificado) */}
          {tipoTurno === 'modificado' && (
            <div style={{ ...statusCard, borderLeft: `5px solid ${COLORS.celeste}`, backgroundColor: '#E0F7FA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.5rem' }}>🌙</span>
                <h5 style={{ margin: 0, color: COLORS.celeste, fontSize: '1.1rem' }}>Turno de Noche</h5>
              </div>
              <p style={{ margin: 0, fontWeight: 700, color: COLORS.gris, fontSize: '1.2rem' }}>
                {dataDelDia.noche.length > 0 ? dataDelDia.noche.join(' y ') : 'Sin grupo asignado'}
              </p>
            </div>
          )}

          {/* Descanso */}
          <div style={{ ...statusCard, borderLeft: `5px solid ${COLORS.gris}`, backgroundColor: '#F5F5F5' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>🏡</span>
              <h5 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem' }}>En Descanso</h5>
            </div>
            <p style={{ margin: 0, fontWeight: 600, color: '#666', fontSize: '1.1rem' }}>
              {dataDelDia.descanso.join(' - ')}
            </p>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto', paddingTop: '30px', textAlign: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#999', fontStyle: 'italic' }}>
            Selecciona cualquier día en el calendario para ver la distribución exacta de los grupos operativos.
          </p>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      <style>{`
        .turnos-layout { display: grid; grid-template-columns: 1.8fr 1fr; gap: 25px; align-items: start; }
        @media (max-width: 900px) { .turnos-layout { display: flex; flexDirection: column; } }
      `}</style>

      {/* TABS SUPERIORES */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button 
          onClick={() => { setTipoTurno('modificado'); setHighlightGroup(null); }}
          style={{...mainTabButton, backgroundColor: tipoTurno === 'modificado' ? COLORS.celeste : COLORS.blanco, color: tipoTurno === 'modificado' ? COLORS.blanco : COLORS.gris}}
        >
          ⚙️ 4x4 Modificado (4 Grupos)
        </button>
        <button 
          onClick={() => { setTipoTurno('lineal'); setHighlightGroup(null); }}
          style={{...mainTabButton, backgroundColor: tipoTurno === 'lineal' ? COLORS.celeste : COLORS.blanco, color: tipoTurno === 'lineal' ? COLORS.blanco : COLORS.gris}}
        >
          📏 4x4 Lineal (2 Grupos)
        </button>
      </div>

      {/* CENTRO DE MANDO */}
      <div className="turnos-layout">
        {renderCalendar()}
        {renderPanelDia()}
      </div>

    </div>
  );
}

// --- ESTILOS ---
const mainTabButton: React.CSSProperties = { padding: '12px 25px', borderRadius: '8px', border: `2px solid ${COLORS.celeste}`, fontWeight: 700, fontSize: '1rem', cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' };
const navButton: React.CSSProperties = { padding: '8px 15px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: COLORS.gris, fontWeight: 700, transition: 'background-color 0.2s' };
const filterButton: React.CSSProperties = { padding: '6px 15px', border: 'none', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s' };
const statusCard: React.CSSProperties = { padding: '20px', borderRadius: '8px', display: 'flex', flexDirection: 'column' };
