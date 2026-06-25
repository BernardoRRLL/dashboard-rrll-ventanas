import { useState, useEffect } from 'react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  linea: '#e0e0e0'
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

    if (proceso.toLowerCase().includes('pension') || proceso.toLowerCase().includes('pensión')) {
      etapasPension.push({ etapa, cant: cantidad });
      if (etapa.toLowerCase().includes('tramite') || etapa.toLowerCase().includes('trámite')) {
        tramitePensionCount += cantidad;
      }
    } else if (proceso.toLowerCase().includes('registro') || proceso.toLowerCase().includes('rnd') || proceso.toLowerCase().includes('nacional')) {
      etapasRND.push({ etapa, cant: quantity => cantidad });
      etapasRND[etapasRND.length - 1].cant = cantidad; // Corrección directa de asignación limpia
      if (etapa.toLowerCase().includes('tramite') || etapa.toLowerCase().includes('trámite')) {
        tramiteRNDCount += cantidad;
      }
    }
  });

  const renderTimeline = (title: string, steps: { etapa: string; cant: number }[]) => (
    <div style={cardStyle}>
      <h4 style={chartTitleStyle}>{title}</h4>
      {steps.length === 0 ? (
        <p style={{ color: '#888', fontSize: '0.9rem', fontStyle: 'italic' }}>No se registran etapas activas en el archivo central.</p>
      ) : (
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row', 
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          gap: '25px', 
          position: 'relative',
          padding: '10px 0'
        }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'row' : 'column', 
              alignItems: 'center', 
              gap: '15px',
              flex: 1,
              width: '100%',
              position: 'relative'
            }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: step.cant > 0 ? COLORS.naranjo : COLORS.gris,
                color: COLORS.blanco,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '1.2rem',
                boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
                zIndex: 2
              }}>
                {step.cant}
              </div>
              
              <div style={{ textAlign: isMobile ? 'left' : 'center', flex: 1 }}>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: COLORS.gris }}>{step.etapa}</p>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: '#777' }}>
                  {step.cant === 1 ? '1 Trabajador' : `${step.cant} Trabajadores`}
                </p>
              </div>

              {!isMobile && idx < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: '25px',
                  left: 'calc(50% + 25px)',
                  width: 'calc(100% - 50px)',
                  height: '3px',
                  backgroundColor: COLORS.linea,
                  zIndex: 1
                }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
        {renderTimeline('Línea de Proceso: Pensión de Invalidez', etapasPension)}
        {renderTimeline('Línea de Proceso: Registro Nacional de Discapacidad (RND)', etapasRND)}
      </div>

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
const chartTitleStyle: React.CSSProperties = { margin: '0 0 20px 0', color: COLORS.gris, fontSize: '1.1rem', fontWeight: 600, borderBottom: '1px solid #eee', paddingBottom: '10px' };
