import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Search, History, Dices, FileDown, CheckSquare, Square, RefreshCw, Save, Trash2, Edit, X } from 'lucide-react';
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

// Asegúrate de que este Base64 esté 100% completo y sea válido.
const LOGO_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAoAAAAFoCAIAAABIUN0GAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6MjcwMzc3NzEwMThDMTFFNjlFMDA5MTZEREVBNkZDQzciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6MjcwMzc3NzIwMThDMTFFNjlFMDA5MTZEREVBNkZDQzciPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDoyNzAzNzc2RjAxOEMxMUU2OUUwMDkxNkRERUE2RkNDNyIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDoyNzAzNzc3MDAxOEMxMUU2OUUwMDkxNkRERUE2RkNDNyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PiPc4DsAADigSURBVHja7N0HmFNV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";

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

        // CORRECCIÓN APLICADA AQUÍ: Se inyecta creando un elemento HTML Image para delegar el parseo nativo o 
        // pasándolo directamente con el esquema explícito de JS PDF.
        try {
            // Pasando LOGO_BASE64 completo con su schema. 
            // Esto asegura que independientemente de la versión de jsPDF, procese el tipo MIME.
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
