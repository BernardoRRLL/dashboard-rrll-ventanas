import React, { useState, useEffect } from 'react';
import { Gift, Calendar } from 'lucide-react';

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
    const currentMonthIdx = todayObj.getMonth(); // 0 para Enero, 6 para Julio, etc.
    const currentMonthNameText = mesesStr[currentMonthIdx].toLowerCase(); // "julio"

    // Generamos una lista de los próximos 7 días con su mes y día para la comparación
    const targetDates = Array.from({ length: 8 }).map((_, i) => {
      const d = new Date();
      d.setDate(todayObj.getDate() + i);
      return {
        mesText: mesesStr[d.getMonth()].toLowerCase(),
        diaNum: d.getDate(),
        mmddKey: `${d.getMonth() + 1}-${d.getDate()}`
      };
    });

    const targetMMDDs = targetDates.map((t: any) => t.mmddKey);
    const todayMMDD = targetMMDDs[0];

    const monthList: any[] = [];
    const next7List: any[] = [];
    const todayList: any[] = [];

    rawData.forEach((row: any) => {
      // 1. Leemos el mes directamente desde la columna dedicada en el Excel
      const mesExcel = String(row['Mes Cumpleaños'] || row['Mes'] || '').toLowerCase().trim();
      if (!mesExcel) return;

      // 2. Extraemos el día de forma segura desde la columna "Fecha Nacimiento"
      const fn = String(row['Fecha Nacimiento'] || row['Fecha de Nacimiento'] || '').trim();
      if (!fn) return;

      let diaInt = 0;
      let mesCalculadoIdx = -1;

      // Evaluamos el formato del texto de la fecha para extraer el día correcto
      if (fn.includes('-')) {
        const parts = fn.split('-');
        if (parts.length >= 3) {
          // Si es YYYY-MM-DD el día suele ser el tercero
          diaInt = parseInt(parts[2].substring(0, 2), 10) || 0;
          mesCalculadoIdx = (parseInt(parts[1], 10) || 1) - 1;
        }
      } else if (fn.includes('/')) {
        const parts = fn.split('/');
        if (parts.length >= 3) {
          // Si es DD/MM/YYYY el día es el primero
          diaInt = parseInt(parts[0], 10) || 0;
          mesCalculadoIdx = (parseInt(parts[1], 10) || 1) - 1;
        }
      }

      // Si por alguna razón el parseo falló pero tenemos el dato en bruto, intentamos rescatarlo
      if (diaInt === 0) return;

      // Si la columna "Mes Cumpleaños" no coincide, usamos el índice calculado de la fecha como respaldo
      const mesNombreFinal = mesExcel || (mesCalculadoIdx !== -1 ? mesesStr[mesCalculadoIdx].toLowerCase() : '');
      const mesIntReal = mesesStr.findIndex((m: string) => m.toLowerCase() === mesNombreFinal) + 1;

      if (mesIntReal === 0) return; // Si no encontramos un mes válido, saltamos la fila

      const empleado = {
        nombre: row['Nombre'] || row['Nombre trabajador/a'] || 'Sin nombre',
        cargo: row['Posición'] || row['Cargo'] || 'Sin cargo',
        area: row['Unidad Organizativa'] || row['Superintendencia / Dirección / Gerencia'] || 'Sin área',
        mmddKey: `${mesIntReal}-${diaInt}`,
        dia: diaInt,
        mes: mesIntReal
      };

      // 3. Clasificación usando la columna limpia del mes del Excel
      if (mesNombreFinal === currentMonthNameText) {
        monthList.push(empleado);
      }
      if (targetMMDDs.includes(empleado.mmddKey)) {
        next7List.push(empleado);
      }
      if (empleado.mmddKey === todayMMDD) {
        todayList.push(empleado);
      }
    });

    // Ordenamos las listas de manera cronológica por el día
    monthList.sort((a: any, b: any) => a.dia - b.dia);
    next7List.sort((a: any, b: any) => {
      return targetMMDDs.indexOf(a.mmddKey) - targetMMDDs.indexOf(b.mmddKey);
    });

    setMesActual(monthList);
    setProximos7Dias(next7List);
    setHoy(todayList);

  }, [rawData]);

  const currentMonthName = mesesStr[new Date().getMonth()];

  const renderList = (titulo: string, lista: any[], icon: React.ReactNode) => (
    <div style={cardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
        <div style={{ color: COLORS.naranjo }}>{icon}</div>
        <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600 }}>{titulo}</h4>
        <span style={{ marginLeft: 'auto', backgroundColor: COLORS.fondo, padding: '2px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 600, color: COLORS.celeste }}>
          {lista.length}
        </span>
      </div>
      
      {lista.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', fontStyle: 'italic', textAlign: 'center', padding: '20px 0' }}>No hay registros para este periodo.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '500px', overflowY: 'auto', paddingRight: '5px' }}>
          {lista.map((emp: any, idx: number) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', backgroundColor: COLORS.fondo, borderRadius: '8px' }}>
              <div style={{ backgroundColor: COLORS.celeste, color: COLORS.blanco, width: '45px', height: '45px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: '1' }}>{emp.dia}</span>
                <span style={{ fontSize: '0.65rem', textTransform: 'uppercase' }}>{mesesStr[emp.mes - 1].substring(0,3)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontWeight: 600, color: COLORS.gris, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.nombre}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.cargo}</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: COLORS.naranjo, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.area}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={{...summaryCardStyle, borderTop: `5px solid ${COLORS.rosado}`}}>
          <h4 style={kpiTitleStyle}>Hoy Cumplen</h4>
          <p style={{...kpiValueStyle, color: COLORS.rosado}}>{hoy.length}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Próximos 7 Días</h4>
          <p style={kpiValueStyle}>{proximos7Dias.length}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Total Mes de {currentMonthName}</h4>
          <p style={kpiValueStyle}>{mesActual.length}</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '25px' }}>
        {renderList('Próximos 7 Días', proximos7Dias, <Gift size={24} />)}
        {renderList(`Cumpleaños de ${currentMonthName}`, mesActual, <Calendar size={24} />)}
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0 };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 200px', minWidth: 0, backgroundColor: COLORS.blanco, padding: '20px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px', borderTop: `5px solid ${COLORS.celeste}` };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 600, margin: '10px 0 0 0' };
