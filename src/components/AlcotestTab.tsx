import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, History, Dices, FileDown, CheckSquare, Square, RefreshCw, Save, Trash2, Edit, X } from 'lucide-react';
import { supabase } from '../supabase'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Importas el logo desde el nuevo archivo
import { LOGO_BASE64 } from './logo';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  verde: '#43A047',
  blanco: '#ffffff'
};

function useSessionStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prevValue) => {
        const valueToStore = value instanceof Function ? value(prevValue) : value;
        window.sessionStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(error);
    }
  }, [key]);

  return [storedValue, setValue];
}

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
}

export default function AlcotestTab({ dotacionData, licenciasData, getShift }: AlcotestTabProps) {
  const [activeView, setActiveView] = useSessionStorage<'generador' | 'historico' | 'buscador'>('alcotest_activeView', 'generador');
  
  const [fechaDesde, setFechaDesde] = useSessionStorage('alcotest_fechaDesde', '');
  const [fechaHasta, setFechaHasta] = useSessionStorage('alcotest_fechaHasta', '');
  const [cuotaTurnoA, setCuotaTurnoA] = useSessionStorage('alcotest_cuotaTurnoA', 2);
  const [cuotaTurnoC, setCuotaTurnoC] = useSessionStorage('alcotest_cuotaTurnoC', 2);
  const [diasExclusion, setDiasExclusion] = useSessionStorage('alcotest_diasExclusion', 21);
  const [resultadosSorteo, setResultadosSorteo] = useSessionStorage<any[]>('alcotest_resultadosSorteo', []);
  
  const [histDesde, setHistDesde] = useSessionStorage('alcotest_histDesde', '');
  const [histHasta, setHistHasta] = useSessionStorage('alcotest_histHasta', '');
  const [historicoData, setHistoricoData] = useSessionStorage<any[]>('alcotest_historicoData', []);
  
  const [searchQuery, setSearchQuery] = useSessionStorage('alcotest_searchQuery', '');
  const [searchResults, setSearchResults] = useSessionStorage<any[]>('alcotest_searchResults', []);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingHist, setIsLoadingHist] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [editAusente, setEditAusente] = useState(false);
  const [editComentario, setEditComentario] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!histDesde || !histHasta) {
      const hoy = new Date();
      const haceUnMes = new Date();
      haceUnMes.setMonth(hoy.getMonth() - 1);
      
      setHistHasta(hoy.toISOString().split('T')[0]);
      setHistDesde(haceUnMes.toISOString().split('T')[0]);
    }
  }, [histDesde, histHasta, setHistDesde, setHistHasta]);

  useEffect(() => {
    const cargarHistorico = async () => {
      if (!histDesde || !histHasta || activeView !== 'historico') return;
      setIsLoadingHist(true);
      try {
        const { data, error } = await supabase
          .from('historico_alcotest')
          .select('*')
          .gte('fecha', histDesde)
          .lte('fecha', histHasta)
          .order('fecha', { ascending: false });
        if (error) throw error;
        setHistoricoData(data || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoadingHist(false);
      }
    };
    cargarHistorico();
  }, [activeView, histDesde, histHasta, setHistoricoData]);

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
    
    if (turno === 'T4' && grupo !== '-' && grupo !== '') {
      const grupoIdx = parseInt(grupo) - 1;
      if (!isNaN(grupoIdx) && grupoIdx >= 0) return getShift(testDate, 'modificado', grupoIdx);
    }
    
    if (turno === 'T4L' && grupo !== '-' && grupo !== '') {
      const grupoIdx = parseInt(grupo) - 1;
      if (!isNaN(grupoIdx) && grupoIdx >= 0) return getShift(testDate, 'lineal', grupoIdx);
    }

    const day = testDate.getDay();
    return (day >= 1 && day <= 4) ? 'Día' : 'Descanso';
  };

  const ejecutarSorteo = async (isReroll = false) => {
    if (!fechaDesde || !fechaHasta) return alert("Selecciona un rango de fechas.");
    const dDesde = new Date(`${fechaDesde}T00:00:00`);
    const dHasta = new Date(`${fechaHasta}T00:00:00`);
    if (dDesde > dHasta) return alert("Fecha 'Desde' no puede ser mayor a 'Hasta'.");

    setIsGenerating(true);
    try {
      const fechaCorte = new Date(dDesde);
      fechaCorte.setDate(fechaCorte.getDate() - diasExclusion);
      
      const { data: historico } = await supabase
        .from('historico_alcotest')
        .select('sap, fecha, ausente')
        .gte('fecha', fechaCorte.toISOString().split('T')[0])
        .lte('fecha', fechaHasta);

      const excludeSapDates: Record<string, number> = {};
      if (historico) {
        historico.forEach(row => {
          if (row.ausente) return; 
          const t = new Date(`${row.fecha}T00:00:00`).getTime();
          if (!excludeSapDates[row.sap] || t > excludeSapDates[row.sap]) {
            excludeSapDates[row.sap] = t;
          }
        });
      }

      let nuevosResultados: any[] = isReroll ? resultadosSorteo.filter(r => r.checked) : [];

      // NUEVA LÓGICA: Inyectar validados en el filtro de exclusión antes de iterar
      if (isReroll) {
        nuevosResultados.forEach(val => {
          const t = new Date(`${val.fecha}T00:00:00`).getTime();
          if (!excludeSapDates[val.sap] || t > excludeSapDates[val.sap]) {
            excludeSapDates[val.sap] = t;
          }
        });
      }

      for (let d = new Date(dDesde); d <= dHasta; d.setDate(d.getDate() + 1)) {
        const currentDateStr = d.toISOString().split('T')[0];
        const currentDTime = d.getTime();
        
        ['Turno A', 'Turno C'].forEach(tipoTurno => {
          const cuota = tipoTurno === 'Turno A' ? cuotaTurnoA : cuotaTurnoC;
          const targetShift = tipoTurno === 'Turno A' ? 'Día' : 'Noche';
          
          const yaSeleccionados = nuevosResultados.filter(r => r.fecha === currentDateStr && r.turno === tipoTurno).length;
          const cuposFaltantes = Math.max(0, cuota - yaSeleccionados);
          
          if (cuposFaltantes > 0) {
            let pool = dotacionData.filter(row => {
              const sap = String(row['SAP'] || '').trim();
              const rut = String(row['Rut'] || '').trim().toLowerCase();
              if (!sap) return false;
              if (nuevosResultados.some(r => r.sap === sap && r.fecha === currentDateStr)) return false;
              
              const lastTestTime = excludeSapDates[sap];
              if (lastTestTime) {
                const daysDiff = (currentDTime - lastTestTime) / (1000 * 60 * 60 * 24);
                if (daysDiff <= diasExclusion) return false;
              }
              
              const estaDeLicencia = licenciasDict.some(lic => lic.rut === rut && d >= lic.fIni && d <= lic.fFin);
              if (estaDeLicencia) return false;
              return getEstadoOperativo(row, d) === targetShift;
            });

            for (let i = pool.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [pool[i], pool[j]] = [pool[j], pool[i]];
            }

            const seleccionados = pool.slice(0, cuposFaltantes).map(row => ({
              id: `${currentDateStr}-${tipoTurno}-${row['SAP']}-${Math.random()}`,
              fecha: currentDateStr,
              turno: tipoTurno,
              sap: String(row['SAP'] || '').trim(),
              nombre: String(row['Nombre trabajador/a'] || row['Nombre'] || '').trim(),
              rut: String(row['Rut'] || '').trim(),
              turno_org: String(row['Turno'] || '').trim(),
              grupo: String(row['Grupo'] || '').trim(),
              rol: String(row['Rol'] || row['Posición'] || '').trim(),
              checked: false
            }));

            seleccionados.forEach(sel => {
              excludeSapDates[sel.sap] = currentDTime;
            });

            nuevosResultados = [...nuevosResultados, ...seleccionados];
          }
        });
      }
      
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

  const imprimirActas = () => {
    if (resultadosSorteo.length === 0) return alert("No hay registros generados para imprimir.");

    try {
      const doc = new jsPDF();
      
      const grupos: Record<string, any> = {};
      resultadosSorteo.forEach(item => {
        const key = `${item.fecha}_${item.turno}`;
        if (!grupos[key]) {
          grupos[key] = { fecha: item.fecha, turno: item.turno, saps: [] };
        }
        grupos[key].saps.push(item.sap);
      });

      const groupKeys = Object.keys(grupos).sort();

      groupKeys.forEach((key, index) => {
        if (index > 0) doc.addPage();
        const grupo = grupos[key];

        // Inyección de imagen respetando el schema y las dimensiones proporcionadas
        try {
            doc.addImage(LOGO_BASE64, 'PNG', 15, 15, 40, 30);
        } catch (e) {
            console.error("Fallo al inyectar imagen en jsPDF. Verifica que LOGO_BASE64 sea válido.", e);
        }

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        const rightX = 135;
        doc.text("Corporación Nacional del", rightX, 20);
        doc.text("Cobre de Chile División", rightX, 24);
        doc.text("Ventanas", rightX, 28);
        doc.text("Carretera F30E N° 58270", rightX, 32);
        doc.text("Ventanas Puchuncavi", rightX, 36);
        doc.text("V Región, Chile", rightX, 40);

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("ACTA SELECCION ALEATORIA", 105, 75, { align: 'center' });
        doc.text('"PROGRAMA ALCOHOL Y DROGAS"', 105, 82, { align: 'center' });

        const saps = [...grupo.saps];
        while (saps.length < 8) saps.push("");
        const tableSaps = saps.slice(0, 8); 

        autoTable(doc, {
          startY: 95,
          head: [['N°SAP', 'N°SAP', 'N°SAP', 'N°SAP', 'N°SAP', 'N°SAP', 'N°SAP', 'N°SAP']],
          body: [tableSaps],
          theme: 'grid',
          headStyles: { fillColor: [150, 150, 150], textColor: 255, halign: 'center', fontSize: 9, fontStyle: 'bold' },
          bodyStyles: { halign: 'center', fontSize: 10, minCellHeight: 8 },
          styles: { lineColor: 0, lineWidth: 0.5 },
          margin: { left: 15, right: 15 }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 45;
        
        doc.setLineWidth(0.5);
        
        doc.line(30, finalY, 90, finalY);
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text("Firma Representante", 60, finalY + 5, { align: 'center' });
        doc.text("Relaciones Laborales", 60, finalY + 9, { align: 'center' });

        doc.line(120, finalY, 180, finalY);
        doc.text("Firma Representante", 150, finalY + 5, { align: 'center' });
        doc.text("Salud Ocupacional", 150, finalY + 9, { align: 'center' });

        const metaY = finalY + 45;
        const dateParts = grupo.fecha.split('-');
        const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        const formatFecha = `${parseInt(dateParts[2])}-${meses[parseInt(dateParts[1])-1]}-${dateParts[0].substring(2)}`;

        doc.text(`Fecha:       ${formatFecha}`, 20, metaY);
        doc.text(`Turno:       ${grupo.turno}`, 20, metaY + 5);

        doc.setFontSize(7);
        doc.setFont("helvetica", "bold");
        const pageHeight = doc.internal.pageSize.height;
        doc.text("Casa Matriz | Chuquicamata | Radomiro Tomic | Ministro Hales | Salvador | Ventanas | Andina | El Teniente | VP", 105, pageHeight - 15, { align: 'center' });
      });

      doc.save('Actas_Sorteo_Alcotest.pdf');
    } catch (error) {
      console.error("Error al generar PDF", error);
      alert("Hubo un problema al generar el PDF.");
    }
  };

  const handleDownloadPDF = () => {
    if (historicoData.length === 0) return alert("No hay registros en pantalla para descargar.");
    
    const doc = new jsPDF();
    doc.setFont("'Poppins', sans-serif");
    doc.setFontSize(14);
    doc.text(`Histórico Control de Alcotest (${histDesde} al ${histHasta})`, 14, 15);
    
    const tableData = historicoData.map((row: any) => [row.fecha, row.turno, row.sap, row.nombre, row.grupo, row.rol]);
    autoTable(doc, { 
      startY: 25, 
      head: [['Fecha', 'Turno', 'SAP', 'Nombre', 'Grupo', 'Rol']], 
      body: tableData, 
      theme: 'grid', 
      headStyles: { fillColor: [0, 152, 170] }, 
      styles: { fontSize: 8 } 
    });
    doc.save(`Historico_Alcotest_${histDesde}_${histHasta}.pdf`);
  };

  const handleSearchSAP = async (overrideQuery?: string) => {
    const query = overrideQuery !== undefined ? overrideQuery : searchQuery;
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      const { data, error } = await supabase
        .from('historico_alcotest')
        .select('*')
        .or(`sap.ilike.%${query}%,nombre.ilike.%${query}%`)
        .order('fecha', { ascending: false });
        
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error(error);
      alert("Error en la búsqueda.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length >= 2) {
      const term = val.toLowerCase();
      const filtered = dotacionData.filter(row => {
        const sap = String(row['SAP'] || '').toLowerCase();
        const nombre = String(row['Nombre trabajador/a'] || row['Nombre'] || '').toLowerCase();
        return sap.includes(term) || nombre.includes(term);
      }).slice(0, 10); 
      
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (sap: string) => {
    setSearchQuery(sap);
    handleSearchSAP(sap);
  };

  const openEditModal = (record: any) => {
    setEditingRecord(record);
    setEditAusente(record.ausente || false);
    setEditComentario(record.comentario || '');
  };

  const closeEditModal = () => {
    setEditingRecord(null);
    setEditAusente(false);
    setEditComentario('');
  };

  const handleUpdateRecord = async () => {
    if (!editingRecord) return;
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('historico_alcotest')
        .update({ ausente: editAusente, comentario: editComentario })
        .eq('fecha', editingRecord.fecha)
        .eq('turno', editingRecord.turno)
        .eq('sap', editingRecord.sap);
      
      if (error) throw error;
      
      const updateList = (list: any[]) => list.map(item => 
        (item.fecha === editingRecord.fecha && item.turno === editingRecord.turno && item.sap === editingRecord.sap)
          ? { ...item, ausente: editAusente, comentario: editComentario }
          : item
      );

      if (activeView === 'historico') {
        setHistoricoData(updateList(historicoData));
      } else if (activeView === 'buscador') {
        setSearchResults(updateList(searchResults));
      }
      
      closeEditModal();
    } catch (error) {
      console.error(error);
      alert("Error al actualizar el registro.");
    } finally {
      setIsUpdating(false);
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
            <div><label style={labelStyle}>Turno A</label><input type="number" min="1" max="8" value={cuotaTurnoA} onChange={e => setCuotaTurnoA(Number(e.target.value))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Turno C</label><input type="number" min="1" max="8" value={cuotaTurnoC} onChange={e => setCuotaTurnoC(Number(e.target.value))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Regla Exclusión (Días)</label><input type="number" min="0" max="180" value={diasExclusion} onChange={e => setDiasExclusion(Number(e.target.value))} style={inputStyle} /></div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>{item.fecha} | {item.turno} | Grupo {item.grupo || '-'} | {item.rol}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                <button onClick={guardarEnHistorico} disabled={isSaving} style={{...primaryButton, backgroundColor: COLORS.verde, flex: 1, justifyContent: 'center'}}>
                  <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar Validados en Histórico Oficial'}
                </button>
                <button onClick={imprimirActas} disabled={isGenerating} style={{...primaryButton, backgroundColor: COLORS.naranjo, flex: 1, justifyContent: 'center'}}>
                  <FileDown size={18} /> Imprimir PDF Actas
                </button>
                <button onClick={() => setResultadosSorteo([])} disabled={isSaving || isGenerating} style={{...primaryButton, backgroundColor: COLORS.gris, flex: 1, justifyContent: 'center'}}>
                  <Trash2 size={18} /> Limpiar Sorteo
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeView === 'historico' && (
        <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '20px' }}>
            <div><label style={labelStyle}>Desde</label><input type="date" value={histDesde} onChange={e => setHistDesde(e.target.value)} style={inputStyle} /></div>
            <div><label style={labelStyle}>Hasta</label><input type="date" value={histHasta} onChange={e => setHistHasta(e.target.value)} style={inputStyle} /></div>
            <button onClick={handleDownloadPDF} style={{...primaryButton, backgroundColor: COLORS.naranjo}}>
              <FileDown size={18} /> Descargar PDF
            </button>
          </div>
          
          <div style={{ overflowX: 'auto' }}>
            {isLoadingHist ? (
              <p style={{ color: COLORS.gris }}>Cargando registros...</p>
            ) : historicoData.length === 0 ? (
              <p style={{ color: COLORS.gris }}>No hay registros en este rango.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.celeste, color: COLORS.blanco, textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Fecha</th>
                    <th style={{ padding: '10px' }}>Turno</th>
                    <th style={{ padding: '10px' }}>SAP</th>
                    <th style={{ padding: '10px' }}>Nombre</th>
                    <th style={{ padding: '10px' }}>Grupo</th>
                    <th style={{ padding: '10px' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoData.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{row.fecha}</td>
                      <td style={{ padding: '10px' }}>{row.turno}</td>
                      <td style={{ padding: '10px' }}>{row.sap}</td>
                      <td style={{ padding: '10px' }}>{row.nombre}</td>
                      <td style={{ padding: '10px' }}>{row.grupo}</td>
                      <td style={{ padding: '10px' }}>
                        {row.ausente ? <span style={{ color: COLORS.naranjo, fontWeight: 700 }}>Ausente</span> : <span style={{ color: COLORS.verde }}>Realizado</span>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => openEditModal(row)} style={iconButton}>
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeView === 'buscador' && (
        <div style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <label style={labelStyle}>Buscar por Nombre o SAP</label>
              <input 
                type="text" 
                value={searchQuery} 
                onChange={handleInputChange}
                onKeyDown={e => e.key === 'Enter' && handleSearchSAP()}
                placeholder="Buscar SAP o Nombre..." 
                style={{ ...inputStyle, width: '100%' }} 
              />
              
              {showSuggestions && suggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: COLORS.blanco,
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  zIndex: 10,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
                  {suggestions.map((sugg, idx) => {
                    const s_sap = String(sugg['SAP'] || '').trim();
                    const s_nombre = String(sugg['Nombre trabajador/a'] || sugg['Nombre'] || '').trim();
                    return (
                      <div 
                        key={idx}
                        onClick={() => handleSelectSuggestion(s_sap)}
                        style={{
                          padding: '10px 12px',
                          cursor: 'pointer',
                          borderBottom: idx === suggestions.length - 1 ? 'none' : '1px solid #eee',
                          fontSize: '0.85rem',
                          color: COLORS.gris
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <strong>{s_sap}</strong> - {s_nombre}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button onClick={() => handleSearchSAP()} disabled={isSearching || !searchQuery} style={{...primaryButton, marginTop: '21px'}}>
              <Search size={18} /> {isSearching ? 'Buscando...' : 'Buscar'}
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            {searchResults.length === 0 && !isSearching && searchQuery && !showSuggestions ? (
              <p style={{ color: COLORS.gris }}>No se encontraron registros históricos.</p>
            ) : searchResults.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.gris, color: COLORS.blanco, textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Fecha</th>
                    <th style={{ padding: '10px' }}>Turno</th>
                    <th style={{ padding: '10px' }}>SAP</th>
                    <th style={{ padding: '10px' }}>Nombre</th>
                    <th style={{ padding: '10px' }}>Estado</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((row, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>{row.fecha}</td>
                      <td style={{ padding: '10px' }}>{row.turno}</td>
                      <td style={{ padding: '10px' }}>{row.sap}</td>
                      <td style={{ padding: '10px' }}>{row.nombre}</td>
                      <td style={{ padding: '10px' }}>
                        {row.ausente ? <span style={{ color: COLORS.naranjo, fontWeight: 700 }}>Ausente</span> : <span style={{ color: COLORS.verde }}>Realizado</span>}
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button onClick={() => openEditModal(row)} style={iconButton}>
                          <Edit size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      )}

      {/* Cuadro Volante (Modal) de Edición */}
      {editingRecord && (
        <div style={modalOverlayStyle}>
          <div style={modalContentStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ margin: 0, color: COLORS.gris }}>Observaciones: {editingRecord.nombre}</h3>
              <button onClick={closeEditModal} style={closeButtonStyle}><X size={20} /></button>
            </div>
            <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#666' }}>
              {editingRecord.fecha} | {editingRecord.turno} | SAP: {editingRecord.sap}
            </p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 600, color: COLORS.gris, fontSize: '0.9rem' }}>
                <input 
                  type="checkbox" 
                  checked={editAusente} 
                  onChange={e => setEditAusente(e.target.checked)} 
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                Marcar como Ausente (no aplica regla exclusión)
              </label>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Comentario / Justificación</label>
              <textarea 
                value={editComentario}
                onChange={e => setEditComentario(e.target.value)}
                style={{ ...inputStyle, width: '100%', minHeight: '80px', resize: 'vertical' }}
                placeholder="Ej: Licencia médica de última hora..."
              />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={closeEditModal} style={{ ...primaryButton, backgroundColor: COLORS.gris }}>Cancelar</button>
              <button onClick={handleUpdateRecord} disabled={isUpdating} style={{ ...primaryButton, backgroundColor: COLORS.celeste }}>
                <Save size={18} /> {isUpdating ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const tabStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '6px', border: `1px solid ${COLORS.celeste}`, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.8rem', fontWeight: 600, color: COLORS.gris, marginBottom: '5px' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ddd', fontFamily: "'Poppins', sans-serif" };
const primaryButton: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: COLORS.celeste, color: COLORS.blanco, padding: '10px 20px', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }; 
const iconButton: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: COLORS.celeste, padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '8px', width: '90%', maxWidth: '500px', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' };
const closeButtonStyle: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' };
