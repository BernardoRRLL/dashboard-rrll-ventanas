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

// Definición maestra: Nombres completos para máxima claridad
const GRUPOS_TURNOS = [
  { id: 'T4-0', label: 'T4 Grupo 1', short: 'T4 G1', tipo: 'modificado' as const, index: 0 },
  { id: 'T4-1', label: 'T4 Grupo 2', short: 'T4 G2', tipo: 'modificado' as const, index: 1 },
  { id: 'T4-2', label: 'T4 Grupo 3', short: 'T4 G3', tipo: 'modificado' as const, index: 2 },
  { id: 'T4-3', label: 'T4 Grupo 4', short: 'T4 G4', tipo: 'modificado' as const, index: 3 },
  { id: 'T4L-0', label: 'T4L Grupo 1', short: 'T4L G1', tipo: 'lineal' as const, index: 0 },
  { id: 'T4L-1', label: 'T4L Grupo 2', short: 'T4L G2', tipo: 'lineal' as const, index: 1 },
];

export default function TurnosTab() {
  // MEJORA 2: Arrancar por defecto en el día actual
  const [calendarDate, setCalendarDate] = useState(new Date()); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // --- MOTOR MATEMÁTICO UNIVERSAL (Día Cero: 1 de Agosto de 2026) ---
  const fechaSemilla = new Date(2026, 7, 1); 

  const getShift = (date: Date, tipo: 'modificado' | 'lineal', groupIndex: number) => {
    const utcDate = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    const utcSemilla = Date.UTC(fechaSemilla.getFullYear(), fechaSemilla.getMonth(), fechaSemilla.getDate());
    const diffDays = Math.floor((utcDate - utcSemilla) / (1000 * 3600 * 24));

    if (tipo === 'modificado') {
      const offsets = [0, 4, 6, 2];
      const dayInCycle = ((diffDays + offsets[groupIndex]) % 8 + 8) % 8;
      
      if (dayInCycle < 2) return 'Día';
      if (dayInCycle < 4) return 'Noche';
      return 'Descanso';
    } else {
      const offsets = [0, 4];
      const dayInCycle = ((diffDays + offsets[groupIndex]) % 8 + 8) % 8;
      
      if (dayInCycle < 4) return 'Día';
      return 'Descanso';
    }
  };

  // --- RESUMEN SUPERIOR (FOTO OPERATIVA) EN LISTAS ---
  const renderFotoOperativa = () => {
    const dataDelDia = GRUPOS_TURNOS.map(g => ({ ...g, shift: getShift(selectedDate, g.tipo, g.index) }));
    
    const enDia = dataDelDia.filter(g => g.shift === 'Día');
    const enNoche = dataDelDia.filter(g => g.shift === 'Noche');
    const enDescanso = dataDelDia.filter(g => g.shift === 'Descanso');

    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const fechaFormateada = selectedDate.toLocaleDateString('es-CL', options);

    return (
      <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #eee', paddingBottom: '12px', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: COLORS.naranjo, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
            Foto Operativa
          </h4>
          <h3 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 700, textTransform: 'capitalize' }}>
            {fechaFormateada}
          </h3>
        </div>

        {/* MEJORA 1: Centrado Vertical de los contenidos dentro de las tarjetas */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          
          <div style={{ ...statusBadge, borderLeftColor: COLORS.naranjo, backgroundColor: '#FFF3E0', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>☀️</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: COLORS.naranjo, fontWeight: 700, textTransform: 'uppercase' }}>Turno de Día</p>
              {/* Contenedor con flex y flex-grow para empujar el contenido al centro vertical */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, justifyContent: 'center' }}>
                {enDia.length > 0 ? enDia.map(g => <span key={g.id} style={listTextItem}>{g.label}</span>) : <span style={listTextItem}>Ninguno</span>}
              </div>
            </div>
          </div>

          <div style={{ ...statusBadge, borderLeftColor: COLORS.celeste, backgroundColor: '#E0F7FA', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>🌙</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: COLORS.celeste, fontWeight: 700, textTransform: 'uppercase' }}>Turno de Noche</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, justifyContent: 'center' }}>
                {enNoche.length > 0 ? enNoche.map(g => <span key={g.id} style={listTextItem}>{g.label}</span>) : <span style={listTextItem}>Ninguno</span>}
              </div>
            </div>
          </div>

          <div style={{ ...statusBadge, borderLeftColor: COLORS.gris, backgroundColor: '#F5F5F5', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '1.2rem', marginTop: '2px' }}>🏡</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '0.8rem', color: COLORS.gris, fontWeight: 700, textTransform: 'uppercase' }}>En Descanso</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1, justifyContent: 'center' }}>
                {enDescanso.length > 0 ? enDescanso.map(g => <span key={g.id} style={{...listTextItem, color: '#666', fontWeight: 500}}>{g.label}</span>) : <span style={listTextItem}>Ninguno</span>}
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // --- RENDERIZADO DEL SÚPER CALENDARIO ---
  const renderCalendar = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const emptyDaysCount = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    
    const emptyCells = Array.from({ length: emptyDaysCount }).map((_, i) => (
      <div key={`empty-${i}`} style={{ minHeight: '100px', backgroundColor: 'transparent' }}></div>
    ));
    
    const dayCells = Array.from({ length: daysInMonth }).map((_, i) => {
      const currentDay = new Date(year, month, i + 1);
      const isSelected = currentDay.getTime() === selectedDate.getTime();
      
      let bgColor = '#fafafa';
      let textColor = '#888';
      let content = null;
      let tooltip = '';
      
      // MODO RUTA ESPECÍFICA (Filtro Aplicado)
      if (activeFilter !== null) {
        const grupoSeleccionado = GRUPOS_TURNOS.find(g => g.id === activeFilter);
        if (grupoSeleccionado) {
          const shift = getShift(currentDay, grupoSeleccionado.tipo, grupoSeleccionado.index);
          if (shift === 'Día') { bgColor = '#FFF3E0'; textColor = COLORS.naranjo; content = <div style={{textAlign: 'center'}}>☀️ Día</div>; }
          else if (shift === 'Noche') { bgColor = '#E0F7FA'; textColor = COLORS.celeste; content = <div style={{textAlign: 'center'}}>🌙 Noche</div>; }
          else { bgColor = '#F5F5F5'; textColor = '#ccc'; content = <div style={{textAlign: 'center'}}>Descanso</div>; }
        }
      } 
      // MODO VISTA GENERAL (Puntitos + Lista Alineada a la Izquierda)
      else {
        bgColor = '#ffffff';
        const dayShifts = GRUPOS_TURNOS.map(g => ({ ...g, shift: getShift(currentDay, g.tipo, g.index) }));
        const inDay = dayShifts.filter(g => g.shift === 'Día');
        const inNight = dayShifts.filter(g => g.shift === 'Noche');
        
        tooltip = `☀️ DÍA:\n${inDay.map(g=>g.label).join('\n')}\n\n🌙 NOCHE:\n${inNight.length > 0 ? inNight.map(g=>g.label).join('\n') : 'Ninguno'}`;
        
        content = (
          <div style={generalViewListContainer}>
            {inDay.map((g) => (
              <div key={`d-${g.id}`} className="mobile-list-text" style={generalViewListItem}>
                <div style={{...dotStyle, backgroundColor: COLORS.naranjo}}></div>
                <span>{g.label}</span>
              </div>
            ))}
            {inNight.map((g) => (
              <div key={`n-${g.id}`} className="mobile-list-text" style={generalViewListItem}>
                <div style={{...dotStyle, backgroundColor: COLORS.celeste}}></div>
                <span>{g.label}</span>
              </div>
            ))}
          </div>
        );
      }

      return (
        <div 
          key={i} 
          onClick={() => setSelectedDate(currentDay)}
          title={tooltip}
          style={{ 
            minHeight: '100px', padding: '8px', border: isSelected ? `2px solid ${COLORS.naranjo}` : '1px solid #eee', 
            borderRadius: '6px', backgroundColor: isSelected && activeFilter === null ? '#fff9f5' : bgColor, 
            display: 'flex', flexDirection: 'column', cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: isSelected ? '0 4px 8px rgba(228, 83, 2, 0.2)' : 'none',
            transform: isSelected ? 'scale(1.02)' : 'none', zIndex: isSelected ? 2 : 1
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 700, color: isSelected ? COLORS.naranjo : textColor }}>{i + 1}</div>
          <div style={{ marginTop: 'auto', marginBottom: 'auto', fontSize: '0.75rem', fontWeight: 600, color: textColor, width: '100%' }}>
            {content}
          </div>
        </div>
      );
    });

    return (
      <div style={{ backgroundColor: COLORS.blanco, padding: 'clamp(15px, 3vw, 30px)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        
        {/* Filtros de Grupos */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '25px', justifyContent: 'center' }}>
          <button 
            onClick={() => setActiveFilter(null)}
            style={{...filterButton, backgroundColor: activeFilter === null ? COLORS.gris : '#f0f0f0', color: activeFilter === null ? COLORS.blanco : '#666'}}
          >
            👁️ Vista General
          </button>
          <div style={{ width: '2px', backgroundColor: '#ddd', margin: '0 5px' }}></div>
          {GRUPOS_TURNOS.map((g) => (
            <button 
              key={g.id} onClick={() => setActiveFilter(g.id)}
              style={{...filterButton, backgroundColor: activeFilter === g.id ? COLORS.celeste : '#f0f0f0', color: activeFilter === g.id ? COLORS.blanco : '#666'}}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Cabecera del Calendario */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' }}>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month - 1, 1))}>◀ Mes Anterior</button>
          <h3 style={{ margin: 0, color: COLORS.gris, fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 700 }}>{monthNames[month]} {year}</h3>
          <button style={navButton} onClick={() => setCalendarDate(new Date(year, month + 1, 1))}>Siguiente Mes ▶</button>
        </div>

        {/* Grilla del Calendario */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 'clamp(4px, 1vw, 10px)' }}>
          {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
            <div key={d} style={{ textAlign: 'center', fontWeight: 700, color: COLORS.gris, paddingBottom: '10px', borderBottom: '2px solid #eee', fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)', textTransform: 'uppercase' }}>
              <span className="hide-on-mobile">{d}</span>
              <span className="show-on-mobile" style={{ display: 'none' }}>{d.substring(0, 3)}</span>
            </div>
          ))}
          {emptyCells}
          {dayCells}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Poppins', sans-serif" }}>
      
      <style>{`
        @media (max-width: 600px) { 
          .hide-on-mobile { display: none !important; }
          .show-on-mobile { display: inline !important; }
          .mobile-list-text { font-size: 0.65rem !important; }
        }
      `}</style>

      {renderFotoOperativa()}
      {renderCalendar()}

    </div>
  );
}

// --- ESTILOS ---
const filterButton: React.CSSProperties = { padding: '8px 16px', border: 'none', borderRadius: '20px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const navButton: React.CSSProperties = { padding: '8px 15px', backgroundColor: '#f5f5f5', border: 'none', borderRadius: '6px', cursor: 'pointer', color: COLORS.gris, fontWeight: 700, transition: 'background-color 0.2s', fontSize: '0.85rem' };
const statusBadge: React.CSSProperties = { padding: '15px', borderRadius: '8px', display: 'flex', gap: '12px', borderLeftWidth: '5px', borderLeftStyle: 'solid', minHeight: '120px' };
const listTextItem: React.CSSProperties = { fontSize: '1rem', color: COLORS.gris, fontWeight: 700 };

const generalViewListContainer: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: '4px', width: 'fit-content', margin: '0 auto' };
const generalViewListItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px' };
const dotStyle: React.CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0 };
