import { useState, useEffect } from 'react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
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

  // 1. Estructura maestra estática para garantizar el despliegue completo de las etapas
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

  // 2. Identificación de columnas mediante escaneo de marcadores estructurales
  let pensionStageKey = '';
  let pensionWorkersKey = '';
  let rndStageKey = '';
  let rndWorkersKey = '';
  let metaKey = '';
  let actualKey = '';

  if (rawData.length > 0) {
    const keys = Object.keys(rawData[0]);
    keys.forEach((k, idx) => {
      const kLow = k.toLowerCase().trim();
      if (kLow.includes('meta')) metaKey = k;
      if (kLow.includes('actual') || kLow.includes('%')) actualKey = k;

      rawData.forEach(row => {
        const val = String(row[k]).toLowerCase().trim();
        if (val.includes('ingreso de solicitud')) {
          pensionStageKey = k;
          if (idx + 1 < keys.length) pensionWorkersKey = keys[idx + 1];
        }
        if (val.includes('recolección de informes')) {
          rndStageKey = k;
          if (idx + 1 < keys.length) rndWorkersKey = keys[idx + 1];
        }
      });
    });
  }

  // 3. Extracción e inyección de datos desde el Excel hacia las estructuras maestras
  rawData.forEach((row: any) => {
    if (metaKey && row[metaKey]) {
      const m = String(row[metaKey]).trim();
      if (m && m.toLowerCase() !== 'meta' && m !== '0') {
        metaVal = m === '0.01' || m === '0,01' ? '1.0%' : m;
      }
    }
    if (actualKey && row[actualKey]) {
      const a = String(row[actualKey]).trim();
      if (a && !a.toLowerCase().includes('actual') && a !== '0') {
        actualVal = a === '0.001' || a === '0,001' ? '0.1%' : a;
      }
    }

    // Mapeo e incremento para Pensión de Invalidez
    if (pensionStageKey && row[pensionStageKey]) {
      const currentStage = String(row[pensionStageKey]).trim().toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
      const workers = parseInt(row[pensionWorkersKey]) || 0;
      
      etapasPension.forEach(item => {
        const targetStage = item.etapa.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
        if (currentStage === targetStage || currentStage.includes(targetStage) || targetStage.includes(currentStage)) {
          if (currentStage.length > 3) item.cant = workers;
        }
      });
    }

    // Mapeo e incremento para RND
    if (rndStageKey && row[rndStageKey]) {
      const currentStage = String(row[rndStageKey]).trim().toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
      const workers = parseInt(row[rndWorkersKey]) || 0;
      
      etapasRND.forEach(item => {
        const targetStage = item.etapa.toLowerCase().replace(/[^a-z0-9áéíóúñ]/g, '');
        if (currentStage === targetStage || currentStage.includes(targetStage) || targetStage.includes(currentStage)) {
          if (currentStage.length > 3) item.cant = workers;
        }
      });
    }
  });

  // Totales dinámicos agregados para las tarjetas superiores (Dando 4 y 1 respectivamente)
  const tramitePensionCount = etapasPension.reduce((sum, item) => sum + item.cant, 0);
  const tramiteRNDCount = etapasRND.reduce((sum, item) => sum + item.cant, 0);

  const renderTimeline = (title: string, steps: { etapa: string; cant: number }[]) => (
    <div style={cardStyle}>
      <h4 style={chartTitleStyle}>{title}</h4>
      <div style={{ 
        position: 'relative', 
        padding: isMobile ? '10px 0 10px 20px' : '40px 0 20px 0',
        marginTop: '10px'
      }}>
        {/* Conector horizontal adaptativo (Desktop) */}
        {!isMobile && (
          <div style={{
            position: 'absolute',
            top: '58px',
            left: '6%',
            width: '88%',
            height: '4px',
            backgroundColor: COLORS.lineaBg,
            borderRadius: '2px',
            zIndex: 1
          }} />
        )}

        {/* Conector vertical adaptativo (Mobile) */}
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
          gap: isMobile ? '35px' : '15px',
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
                gap: isMobile ? '20px' : '15px',
                flex: 1,
                width: '100%',
                textAlign: isMobile ? 'left' : 'center'
              }}>
                {/* Nodo de fase secuencial */}
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: hasWorkers ? COLORS.naranjo : COLORS.blanco,
                  border: `3px solid ${hasWorkers ? COLORS.naranjo : COLORS.nodoInactivo}`,
                  color: hasWorkers ? COLORS.blanco : COLORS.nodoInactivo,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  boxShadow: hasWorkers ? '0 3px 8px rgba(228, 83, 2, 0.3)' : 'none',
                  flexShrink: 0
                }}>
                  {idx + 1}
                </div>

                {/* Etiquetas de etapa y burbujas de volumen */}
                <div style={{ flex: 1, width: '100%' }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.82rem', 
                    fontWeight: 600, 
                    color: COLORS.gris,
                    lineHeight: '1.3',
                    minHeight: isMobile ? 'auto' : '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isMobile ? 'flex-start' : 'center'
                  }}>
                    {step.etapa}
                  </p>
                  {hasWorkers && (
                    <span style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '3px 10px',
                      backgroundColor: 'rgba(224, 83, 2, 0.1)',
                      color: COLORS.naranjo,
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      whiteSpace: 'nowrap'
                    }}>
                      {step.cant === 1 ? '1 Trabajador' : `${step.cant} Trabajadores`}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 4 Tarjetas Simétricas Superiores */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', width: '100%', justifyContent: 'space-between' }}>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>Meta</h4>
          <p style={kpiValueStyle}>{metaVal}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>% Actual</h4>
          <p style={kpiValueStyle}>{actualVal}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>En Trámite RND</h4>
          <p style={kpiValueStyle}>{tramiteRNDCount}</p>
        </div>
        <div style={summaryCardStyle}>
          <h4 style={kpiTitleStyle}>En Trámite Pensión</h4>
          <p style={kpiValueStyle}>{tramitePensionCount}</p>
        </div>
      </div>

      {/* Líneas de Tiempo completas con títulos puros */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
        {renderTimeline('Pensión de Invalidez', etapasPension)}
        {renderTimeline('Registro Nacional de Discapacidad (RND)', etapasRND)}
      </div>

      {/* Nota institucional de cierre */}
      <div style={{ 
        backgroundColor: '#e8f4f5', 
        borderLeft: `5px solid ${COLORS.celeste}`, 
        padding: '15px 20px', 
        borderRadius: '4px',
        marginTop: '5px'
      }}>
        <p style={{ margin: 0, color: COLORS.gris, fontSize: '0.88rem', fontWeight: 500, fontStyle: 'italic' }}>
          💡 <strong>Nota:</strong> Los trabajadores pueden participar en ambos procesos de forma simultánea.
        </p>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' };
const summaryCardStyle: React.CSSProperties = { flex: '1 1 200px', minWidth: 0, backgroundColor: COLORS.blanco, padding: '20px 10px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '120px', borderTop: `5px solid ${COLORS.celeste}` };
const kpiTitleStyle: React.CSSProperties = { margin: 0, color: COLORS.gris, fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' };
const kpiValueStyle: React.CSSProperties = { fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 600, color: COLORS.celeste, margin: '10px 0 0 0' };
const chartTitleStyle: React.CSSProperties = { margin: '0 0 10px 0', color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' };
