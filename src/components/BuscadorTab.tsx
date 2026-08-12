import React, { useState, useMemo } from 'react';
import { Search, User, Briefcase, MapPin, Building2, ChevronUp } from 'lucide-react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  fondo: '#f5f7f8'
};

interface BuscadorTabProps {
  dotacionData: any[];
  jefaturaData: any[]; // La nueva hoja puente
}

export default function BuscadorTab({ dotacionData, jefaturaData }: BuscadorTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // --- DICCIONARIOS DE BÚSQUEDA RÁPIDA ---
  // 1. Diccionario de Dotación: Llave = SAP, Valor = Datos del Trabajador
  const empBySap = useMemo(() => {
    const dict: Record<string, any> = {};
    if (dotacionData) {
      dotacionData.forEach(row => {
        const sap = String(row['SAP'] || row['Número de personal'] || '').trim();
        if (sap) dict[sap] = row;
      });
    }
    return dict;
  }, [dotacionData]);

  // 2. Diccionario de Jefaturas: Llave = SAP Trabajador, Valor = SAP Jefe
  const jefBySap = useMemo(() => {
    const dict: Record<string, string> = {};
    if (jefaturaData) {
      jefaturaData.forEach(row => {
        const sapTrabajador = String(row['SAP Trabajador'] || row['SAP'] || '').trim();
        const sapJefe = String(row['SAP Jefatura'] || row['Jefatura'] || '').trim();
        if (sapTrabajador && sapJefe) dict[sapTrabajador] = sapJefe;
      });
    }
    return dict;
  }, [jefaturaData]);

  // --- LÓGICA DEL BUSCADOR ---
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    
    return dotacionData.filter(row => {
      const sap = String(row['SAP'] || row['Número de personal'] || '').trim().toLowerCase();
      const nombre = String(row['Nombre'] || row['Nombre trabajador/a'] || '').trim().toLowerCase();
      return sap.includes(term) || nombre.includes(term);
    }).slice(0, 8); // Limitamos a los 8 mejores resultados
  }, [searchTerm, dotacionData]);

  // --- LÓGICA DE LA CADENA DE MANDO (EFECTO DOMINÓ) ---
  const getChainOfCommand = (startSap: string) => {
    const chain = [];
    let currentSap = startSap;
    let guard = 0; // Seguridad anti loops infinitos

    while (currentSap && guard < 15) {
      const bossSap = jefBySap[currentSap];
      // Si no tiene jefe o es su propio jefe, detenemos el loop
      if (!bossSap || bossSap === currentSap) break; 
      
      const bossData = empBySap[bossSap];
      if (bossData) {
        chain.push(bossData);
        currentSap = bossSap;
        
        // CORRECCIÓN 1: Detener la cadena de mando en el Gerente General
        const bossName = String(bossData['Nombre'] || bossData['Nombre trabajador/a'] || '').trim().toUpperCase();
        if (bossName === 'WEISHAUPT HIDALGO RICARDO ARMANDO') {
            break; // Cima de la pirámide alcanzada
        }

      } else {
        // Si el jefe no está en la base de datos de dotación, guardamos solo su SAP como referencia
        chain.push({ 'SAP': bossSap, 'Nombre': 'Jefatura Externa / No en Dotación', 'Posición': 'Desconocido' });
        break;
      }
      guard++;
    }
    return chain;
  };

  // Extraemos la cadena si hay un empleado seleccionado
  const selectedSap = selectedEmployee ? String(selectedEmployee['SAP'] || selectedEmployee['Número de personal'] || '').trim() : '';
  const chainOfCommand = selectedSap ? getChainOfCommand(selectedSap) : [];

  // Helpers de visualización
  const getNombre = (row: any) => row['Nombre'] || row['Nombre trabajador/a'] || 'Sin Nombre';
  const getCargo = (row: any) => row['Posición'] || row['Cargo'] || 'Sin Posición';
  const getArea = (row: any) => row['Gerencia / Superintendencia'] || row['Superintendencia / Dirección / Gerencia'] || 'Sin Área';
  const getSap = (row: any) => row['SAP'] || row['Número de personal'] || 'Sin SAP';
  
  // Helper para agrupar Turno, Grupo y Rol (en reemplazo del RUT)
  const getDetalleOperativo = (row: any) => {
      const turno = row['Turno']?.trim() || '';
      const grupo = row['Grupo']?.trim() || '';
      const rol = row['Rol']?.trim() || '';

      const parts = [];
      if (turno && turno !== '-') parts.push(`Turno ${turno}`);
      if (grupo && grupo !== '-') parts.push(`Grupo ${grupo}`);
      if (rol && rol !== '-') parts.push(rol);

      return parts.length > 0 ? parts.join(' | ') : 'Sin detalle operativo';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: "'Poppins', sans-serif" }}>
      
      {/* 1. BARRA DE BÚSQUEDA */}
      <div style={{ backgroundColor: COLORS.blanco, padding: 'clamp(20px, 4vw, 40px)', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', position: 'relative', zIndex: 10 }}>
        <h2 style={{ margin: '0 0 15px 0', color: COLORS.gris, fontSize: 'clamp(1.2rem, 2.5vw, 1.5rem)', fontWeight: 700, textAlign: 'center' }}>
          Directorio de Dotación y Jefaturas
        </h2>
        
        <div style={{ position: 'relative', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
            <Search size={22} />
          </div>
          <input 
            type="text"
            placeholder="Escribe un Nombre, Apellido o número SAP..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            style={{ 
              width: '100%', padding: '16px 16px 16px 50px', borderRadius: '30px', 
              border: `2px solid ${COLORS.celeste}`, fontSize: '1rem', outline: 'none',
              fontFamily: "'Poppins', sans-serif", color: COLORS.gris, boxShadow: '0 4px 10px rgba(0, 152, 170, 0.1)'
            }}
          />
          
          {/* Resultados Desplegables */}
          {isDropdownOpen && searchTerm && searchResults.length > 0 && (
            <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, backgroundColor: COLORS.blanco, borderRadius: '12px', boxShadow: '0 8px 25px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #eee' }}>
              {searchResults.map((emp, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedEmployee(emp);
                    setSearchTerm('');
                    setIsDropdownOpen(false);
                  }}
                  style={{ padding: '12px 20px', cursor: 'pointer', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background-color 0.2s' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: COLORS.gris }}>{getNombre(emp)}</p>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>{getCargo(emp)}</p>
                  </div>
                  <div style={{ backgroundColor: '#E0F7FA', color: COLORS.celeste, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                    SAP: {getSap(emp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. CREDENCIAL Y ORGANIGRAMA */}
      {selectedEmployee && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(300px, 40vw, 500px), 1fr))', gap: '25px', alignItems: 'start' }}>
          
          {/* Tarjeta del Trabajador */}
          <div style={{ backgroundColor: COLORS.blanco, borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ backgroundColor: COLORS.celeste, padding: '25px 20px', color: COLORS.blanco, textAlign: 'center' }}>
              <div style={{ width: '80px', height: '80px', backgroundColor: COLORS.blanco, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px auto', color: COLORS.celeste, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
                <User size={40} />
              </div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '1.4rem', fontWeight: 700 }}>{getNombre(selectedEmployee)}</h3>
              <span style={{ display: 'inline-block', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                SAP: {getSap(selectedEmployee)}
              </span>
            </div>
            
            <div style={{ padding: '25px 30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={infoRowStyle}>
                <div style={iconBoxStyle}><Briefcase size={18} /></div>
                <div><p style={labelStyle}>Posición</p><p style={valueStyle}>{getCargo(selectedEmployee)}</p></div>
              </div>
              <div style={infoRowStyle}>
                <div style={iconBoxStyle}><Building2 size={18} /></div>
                <div><p style={labelStyle}>Área / Gerencia</p><p style={valueStyle}>{getArea(selectedEmployee)}</p></div>
              </div>
              <div style={infoRowStyle}>
                <div style={iconBoxStyle}><MapPin size={18} /></div>
                {/* CORRECCIÓN 2: Reemplazo del RUT por Turno/Grupo/Rol */}
                <div><p style={labelStyle}>Detalle Operativo</p><p style={valueStyle}>{getDetalleOperativo(selectedEmployee)}</p></div>
              </div>
            </div>
          </div>

          {/* Cadena de Mando (Efecto Dominó) */}
          <div style={{ backgroundColor: COLORS.blanco, padding: '30px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <h4 style={{ margin: '0 0 25px 0', color: COLORS.gris, fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
              <ChevronUp size={24} color={COLORS.naranjo} />
              Línea de Reporte Directo
            </h4>
            
            {chainOfCommand.length === 0 ? (
              <p style={{ color: '#888', fontStyle: 'italic' }}>No se registran jefaturas hacia arriba para este trabajador.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {chainOfCommand.map((boss, idx) => {
                  const isTop = idx === chainOfCommand.length - 1;
                  return (
                    <div key={idx} style={{ display: 'flex', position: 'relative' }}>
                      {/* Línea de conexión visual */}
                      {!isTop && <div style={{ position: 'absolute', left: '19px', top: '40px', bottom: '-15px', width: '2px', backgroundColor: '#ddd', zIndex: 1 }}></div>}
                      
                      {/* Nodo (Punto) */}
                      <div style={{ width: '40px', display: 'flex', justifyContent: 'center', zIndex: 2, paddingTop: '5px' }}>
                        <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: isTop ? COLORS.naranjo : COLORS.celeste, border: '3px solid #fff', boxShadow: '0 0 0 2px #eee' }}></div>
                      </div>
                      
                      {/* Información del Jefe */}
                      <div style={{ paddingBottom: '25px', paddingLeft: '10px', flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          {idx === 0 ? 'Jefatura Directa' : 'Reporta a'}
                        </p>
                        <h5 style={{ margin: '2px 0', fontSize: '1.1rem', color: COLORS.gris, fontWeight: 700 }}>
                          {getNombre(boss)}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: isTop ? COLORS.naranjo : COLORS.celeste, fontWeight: 600 }}>
                          {getCargo(boss)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// --- ESTILOS ---
const infoRowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '15px' };
const iconBoxStyle: React.CSSProperties = { width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f0f4f8', color: COLORS.celeste, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const labelStyle: React.CSSProperties = { margin: 0, fontSize: '0.8rem', color: '#888', textTransform: 'uppercase', fontWeight: 600 };
const valueStyle: React.CSSProperties = { margin: 0, fontSize: '1rem', color: COLORS.gris, fontWeight: 700 };
