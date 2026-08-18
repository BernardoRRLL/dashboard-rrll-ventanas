import { useState, useEffect } from 'react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  lineaBg: '#e2e8f0',
  nodoInactivo: '#94a3b8'
};

interface DiscapacidadTabProps {
  rawData: any[];
}

export default function DiscapacidadTab({ rawData }: DiscapacidadTabProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Estructuras maestras estáticas para las líneas de tiempo completas
  const etapasPension = [
    { etapa: "Ingreso de solicitud", cant: 0 },
    { etapa: "Envío a Comisión Médica", cant: 0 },
    { etapa: "Evaluación Médica", cant: 0 },
    { etapa: "Dictamen de Invalidez", cant: 0 },
    { etapa: "Apelación", cant: 0 },
    { etapa: "Resolución de apelación", cant: 0 }
  ];

  const etapasRND = [
    { etapa: "Recolección de Informes", cant: 0 },
    { etapa: "Solicitud en COMPIN", cant: 0 },
    { etapa: "Evaluación COMPIN", cant: 0 },
    { etapa: "Certificación de discapacidad", cant: 0 },
    { etapa: "Ingreso al RND", cant: 0 }
  ];

  let metaVal = "1.0%";
  let actualVal = "0.0%";

  // Función de normalización estricta de cadenas (evita colisiones "Apelación" vs "Resolución de apelación")
  const cleanStr = (str: string) => 
    String(str)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "")
      .trim();

  let pensionStageKey = '';
  let pensionWorkersKey = '';
  let rndStageKey = '';
  let rndWorkersKey = '';
  let metaKey = '';
  let actualKey = '';

  // Identificación dinámica de columnas
  if (rawData.length > 0) {
    const keys = Object.keys(rawData[0]);
    keys.forEach((k, idx) => {
      const kLow = k.toLowerCase().trim();
      if (kLow.includes('meta')) metaKey = k;
      if (kLow.includes('actual') || kLow.includes('%')) actualKey = k;

      rawData.forEach(row => {
        const val = cleanStr(String(row[k]));
        if (val === 'ingresodesolicitud') {
          pensionStageKey = k;
          if (idx + 1 < keys.length) pensionWorkersKey = keys[idx + 1];
        }
        if (val === 'recolecciondeinformes') {
          rndStageKey = k;
          if (idx + 1 < keys.length) rndWorkersKey = keys[idx + 1];
        }
      });
    });
  }

  const formatMetaOrActual = (val: string) => {
    let s = String(val).trim();
    if (!s || s.toLowerCase() === 'meta' || s.toLowerCase().includes('actual') || s === '0') return '';
    if (s.includes('%')) return s;
    const num = parseFloat(s.replace(',', '.'));
    if (!isNaN(num)) {
      if (num > 0 && num < 1) return (num * 100).toFixed(1) + '%';
      return num + '%';
    }
    return s;
  };

  // Mapeo e inyección de datos desde el Excel
  rawData.forEach((row: any) => {
    if (metaKey && row[metaKey]) {
      const m = formatMetaOrActual(row[metaKey]);
      if (m) metaVal = m;
    }
    if (actualKey && row[actualKey]) {
      const a = formatMetaOrActual(row[actualKey]);
      if (a) actualVal = a;
    }

    if (pensionStageKey && row[pensionStageKey]) {
      const currentStage = cleanStr(row[pensionStageKey]);
      const workers = parseInt(String(row[pensionWorkersKey]).trim()) || 0;
      
      etapasPension.forEach(item => {
        if (currentStage === cleanStr(item.etapa)) {
          item.cant = workers;
        }
      });
    }

    if (rndStageKey && row[rndStageKey]) {
      const currentStage = cleanStr(row[rndStageKey]);
      const workers = parseInt(String(row[rndWorkersKey]).trim()) || 0;
      
      etapasRND.forEach(item => {
        if (currentStage === cleanStr(item.etapa)) {
          item.cant = workers;
        }
      });
    }
  });

  const tramitePensionCount = etapasPension.reduce((sum, item) => sum + item.cant, 0);
  const tramiteRNDCount = etapasRND.reduce((sum, item) => sum + item.cant, 0);

  const renderTimeline = (title: string, steps: { etapa: string; cant: number }[]) => (
    <div style={cardStyle}>
      <h4 style={chartTitleStyle}>{title}</h4>
      <div style={{ 
        position: 'relative', 
        padding: isMobile ? '10px 0 10px 20px' : '30px 0 10px 0',
        marginTop: '5px'
      }}>
        {!isMobile && (
          <div style={{
            position: 'absolute',
            top: '48px',
            left: '6%',
            width: '88%',
            height: '4px',
            backgroundColor: COLORS.lineaBg,
            borderRadius: '2px',
            zIndex: 1
          }} />
        )}

        {isMobile && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '24px',
            width: '4px',
            height: 'calc(100% - 40px)',
            backgroundColor: COLORS.lineaBg,
            borderRadius: '2px',
            zIndex: 1
          }} />
        )}

        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: isMobile ? '35px' : '10px',
          position: 'relative',
          zIndex: 2
        }}>
          {steps.map((step, idx) => {
            const hasWorkers = step.cant > 0;
            return (
              <div key={idx} style={{ 
                display: 'flex', 
                flexDirection: isMobile ? 'row' : 'column', 
                alignItems: 'center', 
                gap: isMobile ? '20px' : '10px',
                flex: 1,
                width: '100%',
                textAlign: isMobile ? 'left' : 'center'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: hasWorkers ? COLORS.naranjo : COLORS.blanco,
                  border: `3px solid ${hasWorkers ? COLORS.naranjo : COLORS.nodoInactivo}`,
                  color: hasWorkers ? COLORS.blanco : COLORS.nodoInactivo,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  boxShadow: hasWorkers ? '0 3px 8px rgba(228, 83, 2, 0.3)' : 'none',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                <div style={{ flex: 1, width: '100%' }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.75rem', 
                    fontWeight: 600, 
                    color: COLORS.gris,
                    lineHeight: '1.2',
                    minHeight: isMobile ? 'auto' : '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center'
                  }}>
                    {step.etapa}
                  </p>
                  {hasWorkers && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '4px',
                      padding: '2px 8px',
                      backgroundColor: 'rgba(224, 83, 2, 0.1)',
                      color: COLORS.naranjo,
                      borderRadius: '12px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      {step.cant === 1 ? '1 Trab.' : `${step.cant} Trab.`}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 1. KPIs */}
      <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '15px', width: '100%', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.celeste}`}}>
          <h4 style={kpiTitleStyle}>Meta</h4>
          <p style={kpiValueStyle}>{metaVal}</p>
        </div>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.naranjo}`}}>
          <h4 style={kpiTitleStyle}>% Actual</h4>
          <p style={kpiValueStyle}>{actualVal}</p>
        </div>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.amarillo}`}}>
          <h4 style={kpiTitleStyle}>En Trámite RND</h4>
          <p style={kpiValueStyle}>{tramiteRNDCount}</p>
        </div>
        <div style={{...summaryCardStyle, borderTop: `4px solid ${COLORS.rosado}`}}>
          <h4 style={kpiTitleStyle}>En Trámite Pensión</h4>
          <p style={kpiValueStyle}>{tramitePensionCount}</p>
        </div>
      </div>

      {/* 2. Líneas de Tiempo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', boxSizing: 'border-box' }}>
        {renderTimeline('Pensión de Invalidez', etapasPension)}
        {renderTimeline('Registro Nacional de Discapacidad (RND)', etapasRND)}
      </div>

      {/* 3. Nota */}
      <div style={{ 
        backgroundColor: '#e8f4f5', 
        borderLeft: `4px solid ${COLORS.celeste}`, 
        padding: '10px 15px', 
        borderRadius: '4px',
        boxSizing: 'border-box'
      }}>
        <p style={{ margin: 0, color: COLORS.gris, fontSize: '0.8rem', fontWeight: 500, fontStyle: 'italic' }}>
          💡 <strong>Nota:</strong> Los trabajadores pueden participar en ambos procesos de forma simultánea.
        </p>
      </div>
    </div>
  );
}

// Estilos rediseñados y compactados
const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '15px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', boxSizing: 'border-box' };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 'clamp(90px, 15vw, 150px)', backgroundColor: COLORS.blanco, padding: '10px 4px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '80px', boxSizing: 'border-box' };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: '#666', fontSize: 'clamp(0.55rem, 1.1vw, 0.8rem)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 2.5vw, 2rem)', fontWeight: 600, color: COLORS.celeste, margin: '2px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 5px 0', color: COLORS.gris, fontSize: 'clamp(0.85rem, 1.5vw, 1rem)', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '6px' };
