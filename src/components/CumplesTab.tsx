import React, { useState, useEffect } from 'react';
import { Gift, Calendar, PartyPopper } from 'lucide-react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  fondo: '#f5f7f8'
};

interface CumpleanosProps {
  rawData: any[];
}

export default function CumplesTab({ rawData }: CumpleanosProps) {
  const [mesActual, setMesActual] = useState<any[]>([]);
  const [proximos7Dias, setProximos7Dias] = useState<any[]>([]);
  const [hoy, setHoy] = useState<any[]>([]);

  const mesesStr = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  useEffect(() => {
    const todayObj = new Date();
    const currentMonthIdx = todayObj.getMonth(); 
    const currentMonthNameText = mesesStr[currentMonthIdx].toLowerCase(); 

    const targetDates = Array.from({ length: 8 }).map((_, i) => {
      const d = new Date();
      d.setDate(todayObj.getDate() + i);
      return `${d.getMonth() + 1}-${d.getDate()}`;
    });

    const todayMMDD = targetDates[0];

    const monthList: any[] = [];
    const next7List: any[] = [];
    const todayList: any[] = [];

    rawData.forEach((row: any) => {
      const mesExcel = String(row['Mes Cumpleaños'] || row['Mes'] || '').toLowerCase().trim();
      const mesIntReal = mesesStr.findIndex((m: string) => m.toLowerCase() === mesExcel) + 1;

      if (mesIntReal === 0) return; 

      const fn = String(row['Fecha Nacimiento'] || row['Fecha de Nacimiento'] || '').trim().toLowerCase();
      let diaInt = 0;

      const fnClean = fn.replace(/\//g, '-').trim();
      const matchIso = fnClean.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
      const matchLatam = fnClean.match(/^(\d{1,2})-[a-z0-9]+/);

      if (matchIso) {
         diaInt = parseInt(matchIso[2], 10); 
      } else if (matchLatam) {
         diaInt = parseInt(matchLatam[1], 10); 
      }

      if (diaInt === 0 || diaInt > 31) return;

      const empleado = {
        nombre: row['Nombre'] || row['Nombre trabajador/a'] || 'Sin nombre',
        cargo: row['Posición'] || row['Cargo'] || 'Sin cargo',
        area: row['Unidad Organizativa'] || row['Superintendencia / Dirección / Gerencia'] || 'Sin área',
        mmddKey: `${mesIntReal}-${diaInt}`,
        dia: diaInt,
        mes: mesIntReal
      };

      if (mesExcel === currentMonthNameText) {
        monthList.push(empleado);
      }
      if (targetDates.includes(empleado.mmddKey)) {
        next7List.push(empleado);
      }
      if (empleado.mmddKey === todayMMDD) {
        todayList.push(empleado);
      }
    });

    monthList.sort((a: any, b: any) => a.dia - b.dia);
    next7List.sort((a: any, b: any) => {
      return targetDates.indexOf(a.mmddKey) - targetDates.indexOf(b.mmddKey);
    });

    setMesActual(monthList);
    setProximos7Dias(next7List);
    setHoy(todayList);

  }, [rawData]);

  const currentMonthName = mesesStr[new Date().getMonth()];

  const renderList = (titulo: string, lista: any[], icon: React.ReactNode, isDestacado: boolean = false) => (
    <div style={{ ...cardStyle, borderTop: isDestacado ? `4px solid ${COLORS.rosado}` : 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
        <div style={{ color: isDestacado ? COLORS.rosado : COLORS.naranjo }}>{icon}</div>
        <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '0.95rem', fontWeight: 600 }}>{titulo}</h4>
        <span style={{ marginLeft: 'auto', backgroundColor: isDestacado ? '#fce4ec' : COLORS.fondo, padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, color: isDestacado ? COLORS.rosado : COLORS.celeste }}>
          {lista.length}
        </span>
      </div>
      
      {lista.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center', padding: '15px 0' }}>
          {isDestacado ? 'No hay cumpleaños registrados para el día de hoy.' : 'No hay registros para este periodo.'}
        </p>
      ) : (
        <div style={{ 
          display: isDestacado ? 'grid' : 'flex', 
          gridTemplateColumns: isDestacado ? 'repeat(auto-fill, minmax(250px, 1fr))' : 'none',
          flexDirection: isDestacado ? 'row' : 'column', 
          gap: '8px', 
          maxHeight: '300px', 
          overflowY: 'auto', 
          paddingRight: '5px' 
        }}>
          {lista.map((emp: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', backgroundColor: isDestacado ? '#fdf2f6' : COLORS.fondo, borderRadius: '8px', border: isDestacado ? `1px solid #f8bbd0` : '1px solid transparent', boxSizing: 'border-box' }}>
              <div style={{ backgroundColor: isDestacado ? COLORS.rosado : COLORS.celeste, color: COLORS.blanco, width: '40px', height: '40px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: '1' }}>{emp.dia}</span>
                <span style={{ fontSize: '0.6rem', textTransform: 'uppercase', marginTop: '1px' }}>{mesesStr[emp.mes - 1].substring(0,3)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: COLORS.gris, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nombre}</p>
                <p style={{ margin: '1px 0 0 0', fontSize: '0.7rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.cargo}</p>
                <p style={{ margin: 0, fontSize: '0.7rem', color: isDestacado ? COLORS.rosado : COLORS.naranjo, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.area}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* FILA 1: Resumen */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '15px', width: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.rosado}`}}>
          <h4 style={kpiTitleStyle}>Hoy Cumplen</h4>
          <p style={{...kpiValueStyle, color: COLORS.rosado}}>{hoy.length}</p>
        </div>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.amarillo}`}}>
          <h4 style={kpiTitleStyle}>Próximos 7 Días</h4>
          <p style={{...kpiValueStyle, color: COLORS.amarillo}}>{proximos7Dias.length}</p>
        </div>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.celeste}`}}>
          <h4 style={kpiTitleStyle}>Total Mes de {currentMonthName}</h4>
          <p style={{...kpiValueStyle, color: COLORS.celeste}}>{mesActual.length}</p>
        </div>
      </div>

      {/* FILA 2: Cumpleaños de Hoy (Ocupa todo el ancho) */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {renderList('Cumpleaños de Hoy', hoy, <PartyPopper size={20} />, true)}
      </div>

      {/* FILA 3: Dos columnas (Próximos 7 días y Mes) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', boxSizing: 'border-box' }}>
        {renderList('Próximos 7 Días', proximos7Dias, <Gift size={20} />)}
        {renderList(`Cumpleaños de ${currentMonthName}`, mesActual, <Calendar size={20} />)}
      </div>
      
    </div>
  );
}

// Estilos rediseñados y compactados
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0, boxSizing: 'border-box' };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 'clamp(90px, 15vw, 150px)', backgroundColor: COLORS.blanco, padding: '10px 4px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', boxSizing: 'border-box' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: '#666', fontSize: 'clamp(0.55rem, 1.1vw, 0.8rem)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 2.5vw, 2rem)', fontWeight: 600, margin: '2px 0 0 0' };
