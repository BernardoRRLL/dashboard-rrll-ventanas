import { useState, useEffect } from 'react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  lineaBg: '#e2e8f0',
  lineaActiva: '#0098aa',
  textoMutado: '#64748b'
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

  let metaVal = "1% (Ley 21.015)";
  let actualVal = "0.0%";
  let tramiteRNDCount = 0;
  let tramitePensionCount = 0;

  const etapasPension: { etapa: string; cant: number }[] = [];
  const etapasRND: { etapa: string; cant: number }[] = [];

  // Procesamiento limpio y robusto de la hoja Excel
  rawData.forEach((row: any) => {
    const normalizedRow: any = {};
    Object.keys(row).forEach(k => {
      normalizedRow[k.toLowerCase().trim()] = String(row[k]).trim();
    });

    if (normalizedRow['meta']) metaVal = normalizedRow['meta'];
    if (normalizedRow['actual']) actualVal = normalizedRow['actual'];
    if (normalizedRow['% actual']) actualVal = normalizedRow['% actual'];

    const proceso = normalizedRow['proceso'] || '';
    const etapa = normalizedRow['etapa'] || '';
    const cantidad = parseInt(normalizedRow['cantidad'] || normalizedRow['trabajadores'] || normalizedRow['cant'] || '0') || 0;

    if (etapa.toLowerCase().includes('meta') || proceso.toLowerCase().includes('meta')) {
      metaVal = normalizedRow['cantidad'] || normalizedRow['valor'] || metaVal;
      return;
    }
    if (etapa.toLowerCase().includes('actual') || proceso.toLowerCase().includes('actual')) {
      actualVal = normalizedRow['cantidad'] || normalizedRow['valor'] || actualVal;
      return;
    }

    // Clasificación y suma directa por tipo de proceso global
    if (proceso.toLowerCase().includes('pension') || proceso.toLowerCase().includes('pensión')) {
      if (etapa) {
        etapasPension.push({ etapa, cant: cantidad });
        tramitePensionCount += cantidad;
      }
    } else if (proceso.toLowerCase().includes('registro') || proceso.toLowerCase().includes('rnd') || proceso.toLowerCase().includes('nacional') || proceso.toLowerCase().includes('discapacidad')) {
      if (etapa) {
        etapasRND.push({ etapa, cant: cantidad });
        tramiteRNDCount += cantidad;
      }
    }
  });

  // Renderizador premium de líneas de tiempo
  const renderTimeline = (title: string, steps: { etapa: string; cant: number }[]) => (
    <div style={cardStyle}>
      <h4 style={chartTitleStyle}>{title}</h4>
      {steps.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', fontStyle: 'italic' }}>No se registran etapas activas en el archivo maestro.</p>
      ) : (
        <div style={{ 
          position: 'relative', 
          padding: isMobile ? '10px 0 10px 20px' : '30px 0',
          marginTop: '10px'
        }}>
          {/* Línea guía de fondo */}
          {!isMobile && (
            <div style={{
              position: 'absolute',
              top: '45px',
              left: '5%',
              width: '90%',
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
            alignItems: isMobile ? 'flex-start' : 'flex-start',
            gap: isMobile ? '30px' : '20px',
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
                  gap: isMobile ? '20px' : '12px',
                  flex: 1,
                  width: '100%',
                  textAlign: isMobile ? 'left' : 'center'
                }}>
                  {/* Nodo indicador estilizado */}
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: hasWorkers ? COLORS.naranjo : COLORS.blanco,
                    border: `3px solid ${hasWorkers ? COLORS.naranjo : COLORS.gris}`,
                    color: hasWorkers ? COLORS.blanco : COLORS.gris,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '1rem',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
                    transition: 'all 0.3s ease',
                    flexShrink: 0
                  }}>
                    {idx + 1}
                  </div>

                  {/* Textos informativos inferiores / laterales */}
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      margin: 0, 
                      fontSize: '0.85rem', 
                      fontWeight: 600, 
                      color: COLORS.gris,
                      lineHeight: '1.2'
                    }}>
                      {step.etapa}
                    </p>
                    {hasWorkers && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '5px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(224, 83, 2, 0.1)',
                        color: COLORS.naranjo,
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 700
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
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 4 Tarjetas de Resumen Uniformes */}
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

      {/* Líneas de Tiempo Limpias sin prefijos obsoletos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
        {renderTimeline('Pensión de Invalidez', etapasPension)}
        {renderTimeline('Registro Nacional de Discapacidad (RND)', etapasRND)}
      </div>

      {/* Nota legal / informativa unificada */}
      <div style={{ 
        backgroundColor: '#e8f4f5', 
        borderLeft: `5px solid ${COLORS.celeste}`, 
        padding: '15px 20px', 
        borderRadius: '4px',
        marginTop: '10px'
      }}>
        <p style={{ margin: 0, color: COLORS.gris, fontSize: '0.9rem', fontWeight: 500, fontStyle: 'italic' }}>
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
