import React, { useState, useEffect } from 'react';
import { Gift, Calendar, PartyPopper, Send } from 'lucide-react';

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
  jefaturaData?: any[]; // Opcional por ahora para no romper App.tsx
}

export default function CumplesTab({ rawData, jefaturaData = [] }: CumpleanosProps) {
  const [mesActual, setMesActual] = useState<any[]>([]);
  const [proximos7Dias, setProximos7Dias] = useState<any[]>([]);
  const [hoy, setHoy] = useState<any[]>([]);
  
  // Estados para el Webhook
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // URL DE POWER AUTOMATE
  const WEBHOOK_URL = 'TU_URL_DE_POWER_AUTOMATE_AQUI';

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

      const fn = String(row['Fecha Nacimiento'] || '').trim().toLowerCase();
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
        nombre: row['Nombre'] || 'Sin nombre',
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

  const enviarAvisosPowerAutomate = async () => {
    // 1. Calcular las fechas de la PRÓXIMA SEMANA (Lunes a Domingo)
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 es Domingo, 1 es Lunes
    
    // Cuántos días faltan para el próximo lunes
    const daysToNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
    
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysToNextMonday);

    const proximosDiasTarget = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(nextMonday);
      d.setDate(nextMonday.getDate() + i);
      proximosDiasTarget.push(`${d.getMonth() + 1}-${d.getDate()}`);
    }

    const payloadCumpleaneros: any[] = [];

    // 2. Filtrar cumpleaños de la próxima semana y cruzar datos
    rawData.forEach((row: any) => {
      const mesExcel = String(row['Mes Cumpleaños'] || row['Mes'] || '').toLowerCase().trim();
      const mesIntReal = mesesStr.findIndex((m: string) => m.toLowerCase() === mesExcel) + 1;
      if (mesIntReal === 0) return; 

      const fn = String(row['Fecha Nacimiento'] || '').trim().toLowerCase();
      let diaInt = 0;
      const fnClean = fn.replace(/\//g, '-').trim();
      const matchIso = fnClean.match(/^\d{4}-(\d{1,2})-(\d{1,2})/);
      const matchLatam = fnClean.match(/^(\d{1,2})-[a-z0-9]+/);

      if (matchIso) diaInt = parseInt(matchIso[2], 10); 
      else if (matchLatam) diaInt = parseInt(matchLatam[1], 10); 

      if (diaInt === 0 || diaInt > 31) return;

      const empleadoMMDD = `${mesIntReal}-${diaInt}`;

      if (proximosDiasTarget.includes(empleadoMMDD)) {
        const miSAP = row['SAP'];
        if (!miSAP) return; // Si el trabajador no tiene SAP, no podemos buscar jefe

        // Buscar relación en hoja Jefatura
        const relacion = jefaturaData.find(j => String(j['SAP Trabajador']).trim() === String(miSAP).trim());
        if (!relacion || !relacion['SAP Jefatura']) return; // Huérfano: sin jefatura asignada

        const sapJefe = relacion['SAP Jefatura'];

        // Buscar datos del jefe en hoja Dotación
        const datosJefe = rawData.find(r => String(r['SAP']).trim() === String(sapJefe).trim());
        if (!datosJefe || !datosJefe['Correo']) return; // Huérfano: Jefe no está en dotación o no tiene correo

        payloadCumpleaneros.push({
          sap: miSAP,
          nombre: row['Nombre'],
          cargo: row['Posición'] || row['Cargo'] || 'Sin cargo',
          fecha_cumpleanos: `${diaInt} de ${mesesStr[mesIntReal - 1]}`,
          jefe_nombre: datosJefe['Nombre'],
          jefe_email: datosJefe['Correo']
        });
      }
    });

    if (payloadCumpleaneros.length === 0) {
      alert("No hay cumpleaños con jefatura registrada para la próxima semana.");
      return;
    }

    setIsSending(true);
    setSendStatus('idle');

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cumpleaneros: payloadCumpleaneros }),
      });

      if (!response.ok) throw new Error('Error al conectar con Power Automate');
      
      setSendStatus('success');
      setTimeout(() => setSendStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSendStatus('error');
      setTimeout(() => setSendStatus('idle'), 3000);
    } finally {
      setIsSending(false);
    }
  };

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
      
      {/* SECCIÓN DE CONTROLES */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={enviarAvisosPowerAutomate}
          disabled={isSending}
          title="Extrae los cumpleaños de la próxima semana (Lunes a Domingo) y los envía a Power Automate"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: sendStatus === 'error' ? COLORS.rosado : (sendStatus === 'success' ? '#43A047' : COLORS.celeste),
            color: COLORS.blanco,
            border: 'none',
            padding: '10px 16px',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: isSending ? 'not-allowed' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            transition: 'background-color 0.2s ease'
          }}
        >
          <Send size={16} />
          {isSending ? 'Sincronizando...' : (sendStatus === 'success' ? '¡Enviado con éxito!' : (sendStatus === 'error' ? 'Error de conexión' : 'Sincronizar Avisos Próxima Semana'))}
        </button>
      </div>

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

      {/* FILA 2: Cumpleaños de Hoy */}
      <div style={{ width: '100%', boxSizing: 'border-box' }}>
        {renderList('Cumpleaños de Hoy', hoy, <PartyPopper size={20} />, true)}
      </div>

      {/* FILA 3: Dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', boxSizing: 'border-box' }}>
        {renderList('Próximos 7 Días', proximos7Dias, <Gift size={20} />)}
        {renderList(`Cumpleaños de ${currentMonthName}`, mesActual, <Calendar size={20} />)}
      </div>
      
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', minWidth: 0, boxSizing: 'border-box' };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 'clamp(90px, 15vw, 150px)', backgroundColor: COLORS.blanco, padding: '10px 4px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', boxSizing: 'border-box' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: '#666', fontSize: 'clamp(0.55rem, 1.1vw, 0.8rem)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 2.5vw, 2rem)', fontWeight: 600, margin: '2px 0 0 0' };
