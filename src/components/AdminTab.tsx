import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Shield, Save } from 'lucide-react';

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  blanco: '#ffffff',
  fondo: '#f5f7f8'
};

const MODULOS_DISPONIBLES = [
  { id: 'dotacion', label: 'Dotación' },
  { id: 'participacion', label: 'Participación Femenina' },
  { id: 'sindicatos', label: 'Sindicatos' },
  { id: 'licencias', label: 'Licencias Médicas' },
  { id: 'ausentismo', label: 'Ausentismo y Sobretiempo' },
  { id: 'discapacidad', label: 'Discapacidad' },
  { id: 'cumpleanos', label: 'Cumpleaños' },
  { id: 'comunas', label: 'Comunas' },
  { id: 'turnos', label: 'Calendario de Turnos' },
  { id: 'buscador', label: 'Directorio y Jefaturas' }
];

export default function AdminTab() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('perfiles_usuarios')
      .select('*')
      .order('estado', { ascending: false });
      
    if (error) {
      console.error("Error al cargar usuarios:", error);
    } else if (data) {
      setUsuarios(data);
    }
    setLoading(false);
  };

  const toggleModulo = (userId: string, moduloId: string) => {
    setUsuarios(prev => prev.map(u => {
      if (u.id === userId) {
        const actuales = u.modulos_permitidos || [];
        const nuevos = actuales.includes(moduloId)
          ? actuales.filter((m: string) => m !== moduloId)
          : [...actuales, moduloId];
        return { ...u, modulos_permitidos: nuevos };
      }
      return u;
    }));
  };

  const cambiarEstado = (userId: string, nuevoEstado: string) => {
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, estado: nuevoEstado } : u));
  };

  // NUEVA FUNCIÓN: Cambiar el estado de Súper Administrador
  const toggleAdmin = (userId: string) => {
    setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, es_admin: !u.es_admin } : u));
  };

  const guardarCambios = async (usuario: any) => {
    const { error } = await supabase
      .from('perfiles_usuarios')
      .update({ 
        estado: usuario.estado, 
        modulos_permitidos: usuario.modulos_permitidos,
        es_admin: usuario.es_admin // Ahora también guardamos el poder de admin
      })
      .eq('id', usuario.id);
      
    if (!error) {
      alert('¡Cambios guardados con éxito para ' + usuario.email + '!');
    } else {
      alert('Error al guardar: ' + error.message);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '40px', color: COLORS.gris }}>Cargando panel de control...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontFamily: "'Poppins', sans-serif" }}>
      <div style={{ backgroundColor: COLORS.blanco, padding: '25px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
        <h2 style={{ margin: '0 0 15px 0', color: COLORS.gris, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield color={COLORS.naranjo} size={28} />
          Panel de Administración de Usuarios
        </h2>
        <p style={{ color: '#666', margin: 0, fontSize: '0.9rem' }}>
          Aprueba nuevos usuarios, revoca accesos, define módulos y otorga permisos de Súper Administrador.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {usuarios.map(user => (
          <div key={user.id} style={{ backgroundColor: COLORS.blanco, padding: '20px', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', borderLeft: `5px solid ${user.estado === 'aprobado' ? COLORS.celeste : user.estado === 'pendiente' ? COLORS.amarillo : 'red'}` }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', borderBottom: '1px solid #eee', paddingBottom: '15px', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0, color: COLORS.gris, fontSize: '1.1rem' }}>{user.email}</h3>
                
                {/* NUEVO CHECKBOX: Súper Administrador */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', cursor: 'pointer', userSelect: 'none' }}>
                  <input 
                    type="checkbox" 
                    checked={user.es_admin} 
                    onChange={() => toggleAdmin(user.id)}
                    style={{ accentColor: COLORS.naranjo, width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: user.es_admin ? COLORS.naranjo : '#888', textTransform: 'uppercase', fontWeight: 700 }}>
                    {user.es_admin ? '⭐ Súper Administrador' : 'Usuario Estándar'}
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select 
                  value={user.estado} 
                  onChange={(e) => cambiarEstado(user.id, e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd', outline: 'none', fontWeight: 600, color: COLORS.gris, cursor: 'pointer', backgroundColor: '#f9f9f9' }}
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="aprobado">✅ Aprobado</option>
                  <option value="bloqueado">❌ Bloqueado</option>
                </select>

                <button 
                  onClick={() => guardarCambios(user)}
                  style={{ backgroundColor: COLORS.celeste, color: COLORS.blanco, border: 'none', padding: '8px 15px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Save size={18} /> Guardar
                </button>
              </div>
            </div>

            {!user.es_admin && (
              <div>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: COLORS.gris }}>Módulos Habilitados:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {MODULOS_DISPONIBLES.map(mod => {
                    const isChecked = (user.modulos_permitidos || []).includes(mod.id);
                    return (
                      <label key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: isChecked ? '#E0F7FA' : '#f5f5f5', padding: '6px 12px', borderRadius: '20px', cursor: 'pointer', border: `1px solid ${isChecked ? COLORS.celeste : '#ddd'}`, transition: 'all 0.2s', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={isChecked} 
                          onChange={() => toggleModulo(user.id, mod.id)}
                          style={{ display: 'none' }}
                        />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isChecked ? COLORS.celeste : '#888' }}>
                          {mod.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
            {user.es_admin && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>
                Los administradores tienen acceso irrestricto a todos los módulos y bases de datos.
              </p>
            )}

          </div>
        ))}
      </div>
    </div>
  );
}
