import React, { useState, useMemo } from 'react';
import { Search, History, Dices, FileDown, CheckSquare, Square, RefreshCw, Save } from 'lucide-react';
import { supabase } from '../supabase'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  verde: '#43A047',
  blanco: '#ffffff'
};

interface AlcotestTabProps {
  dotacionData: any[];
  licenciasData: any[];
  getShift: (date: Date, tipo: 'modificado' | 'lineal', groupIndex: number) => string;
}

const parseCustomDate = (dateVal: any) => {
  if (!dateVal) return null;
  if (typeof dateVal === 'number' || (!isNaN(Number(dateVal)) && Number(dateVal) > 10000)) {
    const jsDate = new Date(Math.round((Number(dateVal) - 25569) * 86400 * 1000));
    return new Date(jsDate.getUTCFullYear(), jsDate.getUTCMonth(), jsDate.getUTCDate(), 0, 0, 0);
  }
  const fallback = new Date(dateVal);
  if (!isNaN(fallback.getTime())) return fallback;
  return null;
};

export default function AlcotestTab({ dotacionData, licenciasData, getShift }: AlcotestTabProps) {
  const [activeView, setActiveView] = useState<'generador' | 'historico' | 'buscador'>('generador');
  
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [cuotaTurnoA, setCuotaTurnoA] = useState(2);
  const [cuotaTurnoC, setCuotaTurnoC] = useState(2);
  
  const [resultadosSorteo, setResultadosSorteo] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [histDesde, setHistDesde] = useState('');
  const [histHasta, setHistHasta] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Diccionario de licencias para cruce rápido
  const licenciasDict = useMemo(() => {
    const dict: any[] = [];
    licenciasData.forEach(row => {
      const rut = String(row['Rut'] || row['SAP'] || '').trim().toLowerCase();
      const fIni = parseCustomDate(row['Fecha de Inicio']);
      const fFin = parseCustomDate(row['Fecha Termino']);
      if (rut && fIni && fFin) dict.push({ rut, fIni, fFin });
    });
    return dict;
  }, [licenciasData]);

  const getEstadoOperativo = (row: any, testDate: Date) => {
    const turno = String(row['Turno'] || '').trim().toUpperCase();
    const grupo = String(row['Grupo'] || '').trim();
    if (grupo === '-' || grupo === '') return 'Administrativo';
    const grupoIdx = parseInt(grupo) - 1;
    if (isNaN(grupoIdx) || grupoIdx < 0) return 'Desconocido';
    if (turno === 'T4') return getShift(testDate, 'modificado', grupoIdx);
    if (turno === 'T4L') return getShift(testDate, 'lineal', grupoIdx);
    return 'Administrativo';
  };

  const ejecutarSorteo = async (isReroll = false) => {
    if (!fechaDesde || !fechaHasta) return alert("Selecciona un rango de fechas.");
    const dDesde = new Date(`${fechaDesde}T00:00:00`);
    const dHasta = new Date(`${fechaHasta}T00:00:00`);
    if (dDesde > dHasta) return alert("Fecha 'Desde' no puede ser mayor a 'Hasta'.");

    setIsGenerating(true);
    try {
      // 1. Obtener histórico de los últimos 21 días desde la fecha de inicio
      const fechaMenos21 = new Date(dDesde);
      fechaMenos21.setDate(fechaMenos21.getDate() - 21);
      
      const { data: historico } = await supabase
        .from('historico_alcotest')
        .select('sap, fecha')
        .gte('fecha', fechaMenos21.toISOString().split('T')[0])
        .lte('fecha', fechaHasta);

      const excludeSapDict: Record<string, string[]> = {};
      if (historico) {
        historico.forEach(row => {
          if (!excludeSapDict[row.sap]) excludeSapDict[row.sap] = [];
          excludeSapDict[row.sap].push(row.fecha);
        });
      }

      let nuevosResultados: any[] = isReroll ? resultadosSorteo.filter(r => r.checked) : [];

      // 2. Iterar por cada día del rango
      for (let d = new Date(dDesde); d <= dHasta; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toISOString().split('T')[0];
        
        ['Turno A', 'Turno C'].forEach(tipoTurno => {
          const cuota = tipoTurno === 'Turno A' ? cuotaTurnoA : cuotaTurnoC;
          const targetShift = tipoTurno === 'Turno A' ? 'Día' : 'Noche';
          
          const yaSeleccionados = nuevosResultados.filter(r => r.fecha === currentDateStr && r.turno === tipoTurno).length;
          const cuposFaltantes = cuota - yaSeleccionados;
          
          if (cuposFaltantes > 0) {
            // Filtrar candidatos vivos
            let pool = dotacionData.filter(row => {
              const sap = String(row['SAP'] || '').trim();
              const rut = String(row['Rut'] || '').trim().toLowerCase();
              if (!sap) return false;

              // Ya está en el sorteo actual?
              if (nuevosResultados.some(r => r.sap === sap && r.fecha === currentDateStr)) return false;

              // Regla 21 días (Aproximación por mes activo)
              if (excludeSapDict[sap]) return false; 

              // Filtro Licencias Médicas
              const estaDeLicencia = licenciasDict.some(lic => lic.rut === rut && d >= lic.fIni && d <= lic.fFin);
              if (estaDeLicencia) return false;

              // Filtro Turno Físico
              return getEstadoOperativo(row, d) === targetShift;
            });

            // Muestra aleatoria (Fisher-Yates shuffle)
            for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const seleccionados = pool.slice(0, cuposFaltantes).map(row => ({
              id: `${currentDateStr}-${tipoTurno}-${row['SAP']}`,
              fecha: currentDateStr,
              turno: tipoTurno,
              sap: String(row['SAP'] || '').trim(),
              nombre: String(row['Nombre trabajador/a'] || row['Nombre'] || '').trim(),
              rut: String(row['Rut'] || '').trim(),
              turno_org: String(row['Turno'] || '').trim(),
              grupo: String(row['Grupo'] || '').trim(),
              rol: String(row['Rol'] || row['Posición'] || '').trim(),
              checked: true
            }));

            nuevosResultados = [...nuevosResultados, ...seleccionados];
          }
        });
      }
      
      // Ordenar por fecha y luego turno
      nuevosResultados.sort((a, b) => a.fecha.localeCompare(b.fecha) || a.turno.localeCompare(b.turno));
      setResultadosSorteo(nuevosResultados);
      
    } catch (error) {
      console.error(error);
      alert("Error al generar sorteo.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleCheck = (id: string) => {
    setResultadosSorteo(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
  };

  const guardarEnHistorico = async () => {
    const validados = resultadosSorteo.filter(r => r.checked);
    if (validados.length === 0) return alert("No hay registros validados para guardar.");

    setIsSaving(true);
    try {
      const registrosDB = validados.map(({ checked, id, ...rest }) => rest);
      const { error } = await supabase.from('historico_alcotest').insert(registrosDB);
      if (error) throw error;
      
      alert("Registros guardados en el histórico oficial.");
      setResultadosSorteo([]);
    } catch (error) {
      console.error(error);
      alert("Error al guardar en base de datos.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!histDesde || !histHasta) return alert("Selecciona un rango.");
    setIsDownloading(true);
    try {
      const { data, error } = await supabase.from('historico_alcotest').select('*').gte('fecha', histDesde).lte('fecha', histHasta).order('fecha', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return alert("No hay registros.");

      const doc = new jsPDF();
      doc.setFont("'Poppins', sans-serif");
      doc.setFontSize(14);
      doc.text(`Histórico Control de Alcotest (${histDesde} al ${histHasta})`, 14, 15);
      
      const tableData = data.map((row: any) => [row.fecha, row.turno, row.sap, row.nombre, row.grupo, row.rol]);
      autoTable(doc, { startY: 25, head: [['Fecha', 'Turno', 'SAP', 'Nombre', 'Grupo', 'Rol']], body: tableData, theme: 'grid', headStyles: { fillColor: [0, 152, 170] }, styles: { fontSize: 8 } });
      doc.save(`Historico_Alcotest_${histDesde}_${histHasta}.pdf`);
    } catch (error) {
      alert("Error al descargar.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '10px' }}>
        <button onClick={() => setActiveView('generador')} style={{...tabStyle, backgroundColor: activeView === 'generador' ? COLORS.celeste : COLORS.blanco, color: activeView === 'generador' ? COLORS.blanco : COLORS.gris}}>
          <Dices size={16} /> Generador
        </button>
        <button onClick={() => setActiveView('buscador')} style={{...tabStyle, backgroundColor: activeView === 'buscador' ? COLORS.celeste : COLORS.blanco, color: activeView === 'buscador' ? COLORS.blanco : COLORS.gris}}>
          <Search size={16} /> Buscador SAP
        </button>
        <button onClick={() => setActiveView('historico')} style={{...tabStyle, backgroundColor: activeView === 'historico' ? COLORS.celeste : COLORS.blanco, color: activeView === 'historico' ? COLORS.blanco : COLORS.gris}}>
          <History size={16} /> Histórico / PDF
        </button>
      </div>

      {activeView === 'generador' && (
        <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div><label style={labelStyle}>Desde</label><input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Hasta</label><input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Turno A</label><input type="number" min="1" max="10" value={cuotaTurnoA} onChange={e => setCuotaTurnoA(Number(e.target.value))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Turno C</label><input type="number" min="1" max="10" value={cuotaTurnoC} onChange={e => setCuotaTurnoC(Number(e.target.value))} style={inputStyle} /></div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => ejecutarSorteo(false)} disabled={isGenerating} style={primaryButton}>
              <Dices size={18} /> {isGenerating ? 'Calculando...' : 'Generar Sorteo'}
            </button>
            {resultadosSorteo.length > 0 && (
              <button onClick={() => ejecutarSorteo(true)} disabled={isGenerating} style={{...primaryButton, backgroundColor: COLORS.naranjo}}>
                <RefreshCw size={18} /> Re-sortear Desmarcados
              </button>
            )}
          </div>

          {resultadosSorteo.length > 0 && (
            <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
              <div style={{ display: 'grid', gap: '10px' }}>
                {resultadosSorteo.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '10px', backgroundColor: item.checked ? '#f0f9ff' : '#fff5f5', border: `1px solid ${item.checked ? COLORS.celeste : '#ffebee'}`, borderRadius: '6px' }}>
                    <div onClick={() => toggleCheck(item.id)} style={{ cursor: 'pointer', color: item.checked ? COLORS.celeste : '#ccc' }}>
                      {item.checked ? <CheckSquare size={24} /> : <Square size={24} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.9rem', color: COLORS.gris }}>{item.nombre} <span style={{ color: COLORS.naranjo, fontSize: '0.8rem' }}>(SAP: {item.sap})</span></p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{item.fecha} | {item.turno} | Grupo {item.grupo}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={guardarEnHistorico} disabled={isSaving} style={{...primaryButton, backgroundColor: COLORS.verde, marginTop: '20px', width: '100%', justifyContent: 'center'}}>
                <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Validados en Histórico Oficial'}
              </button>
            </div>
          )}
        </div>
      )}

      {activeView === 'historico' && (
        <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div><label style={labelStyle}>Desde</label><input type="date" value={histDesde} onChange={e => setHistDesde(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Hasta</label><input type="date" value={histHasta} onChange={e => setHistHasta(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleDownloadPDF} disabled={isDownloading} style={{...primaryButton, backgroundColor: COLORS.naranjo}}>
              <FileDown size={18} /> Descargar PDF
            </button>
          </div>
        </div>
      )}

      {activeView === 'buscador' && (
        <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}><p>Buscador en construcción.</p></div>
      )}
    </div>
  );
}

const tabStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: `1px solid ${COLORS.celeste}`, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: COLORS.gris, marginBottom: '5px' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: "'Poppins', sans-serif" };
const primaryButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.celeste, color: COLORS.blanco, padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' };
