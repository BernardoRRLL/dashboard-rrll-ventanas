import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Users, Venus, Handshake, Stethoscope, Scale, Accessibility, Gift, MapPin, Clock, Search, Lock, Mail, Key, Shield, Clock4 } from 'lucide-react';

// Importamos nuestra conexión segura a Supabase
import { supabase } from './supabase';

import Header from './components/Header';
import Footer from './components/Footer';
import DotacionTab from './components/DotacionTab';
import ParticipacionFemeninaTab from './components/ParticipacionFemeninaTab';
import SindicatosTab from './components/SindicatosTab';
import LicenciasTab from './components/LicenciasTab';
import AusentismoTab from './components/AusentismoTab';
import DiscapacidadTab from './components/DiscapacidadTab';
import CumplesTab from './components/CumplesTab';
import ComunasTab from './components/ComunasTab';
import TurnosTab from './components/TurnosTab';
import BuscadorTab from './components/BuscadorTab';
import AdminTab from './components/AdminTab'; // El nuevo Panel de Control

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler } from 'chart.js';
import ChartJSPluginDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, Filler, ChartJSPluginDataLabels);

const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  fondo: '#f5f7f8',
  blanco: '#ffffff'
};

export default function App() {
  // --- ESTADOS DE SEGURIDAD (SUPABASE) ---
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Perfil y permisos del usuario
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');

  // --- ESTADOS DEL DASHBOARD ---
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || 'home';
  });
  
  const [rawData, setRawData] = useState<any[]>([]); 
  const [licenciasData, setLicenciasData] = useState<any[]>([]); 
  const [ausentismoData, setAusentismoData] = useState<any[]>([]); 
  const [discapacidadData, setDiscapacidadData] = useState<any[]>([]); 
  const [comunasSheetData, setComunasSheetData] = useState<any[]>([]); 
  const [jefaturaData, setJefaturaData] = useState<any[]>([]);

  const [globalSummary, setGlobalSummary] = useState({ total: 0, mujeres: "0", ausentismo: "0", sobretiempo: "0" });
  const [dotacionStats, setDotacionStats] = useState({ total: 0, indefinido: "0", edadPromedio: "0", edadPromedioF: "0", edadPromedioM: "0" });
  const [isLoading, setIsLoading] = useState(false);

  // --- VERIFICAR SESIÓN Y PERFIL ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserProfile(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserProfile(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase.from('perfiles_usuarios').select('*').eq('id', userId).single();
    if (data) {
      setUserProfile(data);
    }
  };

  // --- NAVEGACIÓN Y CARGA DE DATOS ---
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      setActiveTab(hash || 'home');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    // SOLO cargar los datos si hay sesión Y el usuario está aprobado (o es admin)
    if (!session || !userProfile || userProfile.estado !== 'aprobado') return;

    const loadSecureData = async () => {
      try {
        setIsLoading(true);
        // DESCARGA SECRETA DESDE SUPABASE STORAGE
        const { data, error } = await supabase.storage.from('rrll-data').download('data.xlsx');
        
        if (error) throw error;
        if (!data) throw new Error("No se pudo descargar el archivo de la bóveda.");

        const arrayBuffer = await data.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        let dotacionName = sheetNames.find(n => n === "Dotación" || n.toLowerCase().includes('dotaci')) || sheetNames[0];
        let licenciasName = sheetNames.find(n => n === "Licencias" || n.toLowerCase().includes('licencia')) || (sheetNames.length > 1 ? sheetNames[1] : null);
        let ausentismoName = sheetNames.find(n => n.toLowerCase().includes('ausdeo') || n.toLowerCase().includes('ausentismo'));
        let discapacidadName = sheetNames.find(n => n.toLowerCase().includes('discapacidad') || n.toLowerCase().includes('disc'));
        let comunasName = sheetNames.find(n => n.toLowerCase().includes('comuna'));
        let jefaturaName = sheetNames.find(n => n.toLowerCase().includes('jefatura'));

        const dotacionJson = XLSX.utils.sheet_to_json(workbook.Sheets[dotacionName], { raw: false, defval: "" });
        const licenciasJson = licenciasName ? XLSX.utils.sheet_to_json(workbook.Sheets[licenciasName], { raw: false, defval: "" }) : dotacionJson;
        const ausentismoJson = ausentismoName ? XLSX.utils.sheet_to_json(workbook.Sheets[ausentismoName], { header: 1, raw: false, defval: "" }) as any : [];
        const discapacidadJson = discapacidadName ? XLSX.utils.sheet_to_json(workbook.Sheets[discapacidadName], { raw: false, defval: "" }) : [];
        const comunasJson = comunasName ? XLSX.utils.sheet_to_json(workbook.Sheets[comunasName], { raw: false, defval: "" }) : [];
        const jefaturaJson = jefaturaName ? XLSX.utils.sheet_to_json(workbook.Sheets[jefaturaName], { raw: false, defval: "" }) : [];

        setRawData(dotacionJson);
        setLicenciasData(licenciasJson);
        setAusentismoData(ausentismoJson);
        setDiscapacidadData(discapacidadJson);
        setComunasSheetData(comunasJson); 
        setJefaturaData(jefaturaJson);
        
        calculateSummaries(dotacionJson, ausentismoJson);
        setIsLoading(false); 

      } catch (error) {
        console.error("Error al cargar la base de datos de Supabase:", error);
        setIsLoading(false);
      }
    };

    loadSecureData();
  }, [session, userProfile]);

  // --- FUNCIONES DE LOGIN Y REGISTRO ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError('Credenciales incorrectas o acceso denegado.');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthMessage('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    
    if (error) {
      setAuthError(error.message);
    } else if (data.user) {
      // Registrar automáticamente en la tabla de perfiles en estado pendiente
      await supabase.from('perfiles_usuarios').insert([
        { id: data.user.id, email: email, estado: 'pendiente', es_admin: false, modulos_permitidos: [] }
      ]);
      setAuthMessage('Solicitud recibida. Cuenta creada exitosamente. Espera aprobación del administrador.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  const handleTabChange = (tabId: string) => {
    window.location.hash = tabId === 'home' ? '' : tabId;
    setActiveTab(tabId);
  };

  const calculateSummaries = (dotData: any[], ausData: any) => {
    const total = dotData.length; 
    if (total === 0) return;

    const mujeres = dotData.filter(row => String(row.Sexo).trim() === 'F').length;
    const indefinidos = dotData.filter(row => String(row['Tipo Contrato']).trim() === 'Indefinido').length;
    
    let sumaEdades = 0, sumaF = 0, totalF = 0, sumaM = 0, totalM = 0;
    dotData.forEach((row: any) => {
      const edad = Number(row['Edad']) || 0; 
      const sexo = String(row['Sexo'] || '').trim();
      if (edad > 0) {
        sumaEdades += edad;
        if (sexo === 'F') { sumaF += edad; totalF++; }
        if (sexo === 'M') { sumaM += edad; totalM++; }
      }
    });

    let ausentismoTotal = 0;
    let sobretiempoTotal = 0; 
    
    if (ausData && ausData.length > 0) {
      const parsePercent = (val: any) => {
        const str = String(val).trim().replace(',', '.');
        if (str.includes('%')) return parseFloat(str.replace('%', ''));
        return parseFloat(str) * 100;
      };

      const getRowData = (keyword: string, occurrence = 1) => {
        const rows = ausData.filter((r: any) => r.some((cell: any) => String(cell).trim() === keyword));
        const targetRow = rows[occurrence - 1];
        if (!targetRow) return [];
        const idx = targetRow.findIndex((cell: any) => String(cell).trim() === keyword);
        const values = [];
        for (let i = idx + 1; i <= idx + 12; i++) {
          if (targetRow[i] !== undefined && targetRow[i] !== "") {
            const val = parsePercent(targetRow[i]);
            if (!isNaN(val)) values.push(val);
          }
        }
        return values;
      };

      const areas = ['Mantenimiento', 'Refino a Fuego', 'Refineria', 'Staff'];
      let sumLM = 0, sumPermisos = 0, sumST = 0;
      
      areas.forEach((area: string) => {
        const vals = getRowData(area, 1);
        sumLM += vals[0] || 0;
        sumPermisos += vals[1] || 0;
        
        const valsST = getRowData(area, 2);
        sumST += valsST[0] || 0;
      });
      
      ausentismoTotal = sumLM + sumPermisos;
      sobretiempoTotal = sumST;
    }

    setGlobalSummary({ 
      total, 
      mujeres: ((mujeres / total) * 100).toFixed(1), 
      ausentismo: ausentismoTotal.toFixed(2),
      sobretiempo: sobretiempoTotal.toFixed(2) 
    });

    setDotacionStats({ total, indefinido: ((indefinidos / total) * 100).toFixed(1), edadPromedio: (sumaEdades / total).toFixed(1), edadPromedioF: totalF > 0 ? (sumaF / totalF).toFixed(1) : "0", edadPromedioM: totalM > 0 ? (sumaM / totalM).toFixed(1) : "0" });
  };

  // --- RENDER DE LA PANTALLA DE LOGIN ---
  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo, fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ backgroundColor: COLORS.blanco, padding: '40px', borderRadius: '12px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', maxWidth: '400px', width: '90%' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ backgroundColor: '#FFF3E0', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px' }}>
              <Lock size={30} color={COLORS.naranjo} />
            </div>
            <h2 style={{ margin: 0, color: COLORS.gris, fontSize: '1.5rem', fontWeight: 700 }}>Portal RRLL</h2>
            <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>Codelco División Ventanas</p>
          </div>
          
          <form onSubmit={isRegistering ? handleRegister : handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: COLORS.gris, fontWeight: 600 }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} color="#aaa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="usuario@codelco.cl"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontFamily: "'Poppins', sans-serif", fontSize: '0.95rem' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.85rem', color: COLORS.gris, fontWeight: 600 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Key size={18} color="#aaa" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #ddd', outline: 'none', fontFamily: "'Poppins', sans-serif", fontSize: '0.95rem' }} />
              </div>
            </div>
            
            {authError && <p style={{ color: 'red', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>{authError}</p>}
            {authMessage && <p style={{ color: 'green', fontSize: '0.8rem', margin: 0, textAlign: 'center' }}>{authMessage}</p>}
            
            <button type="submit" style={{ backgroundColor: COLORS.celeste, color: COLORS.blanco, border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', marginTop: '10px', fontSize: '1rem', transition: 'background-color 0.2s' }}>
              {isRegistering ? 'Solicitar Cuenta' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
            <button onClick={() => {setIsRegistering(!isRegistering); setAuthError(''); setAuthMessage('');}} style={{ background: 'none', border: 'none', color: COLORS.naranjo, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
              {isRegistering ? '¿Ya tienes acceso? Inicia sesión' : 'Solicitar un nuevo usuario'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER DE SALA DE ESPERA ---
  if (userProfile && userProfile.estado !== 'aprobado') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.fondo, fontFamily: "'Poppins', sans-serif" }}>
        <div style={{ backgroundColor: COLORS.blanco, padding: '40px', borderRadius: '12px', boxShadow: '0 4px 25px rgba(0,0,0,0.06)', maxWidth: '450px', width: '90%', textAlign: 'center' }}>
          <div style={{ backgroundColor: userProfile.estado === 'bloqueado' ? '#ffebee' : '#fff8e1', width: '70px', height: '70px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Clock4 size={35} color={userProfile.estado === 'bloqueado' ? 'red' : COLORS.amarillo} />
          </div>
          <h2 style={{ margin: '0 0 10px 0', color: COLORS.gris, fontSize: '1.4rem', fontWeight: 700 }}>
            {userProfile.estado === 'bloqueado' ? 'Acceso Suspendido' : 'Cuenta en Revisión'}
          </h2>
          <p style={{ color: '#666', fontSize: '0.95rem', marginBottom: '25px', lineHeight: '1.5' }}>
            {userProfile.estado === 'bloqueado' 
              ? 'Tu acceso a la plataforma ha sido revocado. Por favor, contacta con la gerencia.' 
              : 'Tu solicitud de acceso ha sido recibida. Un administrador debe aprobar tu cuenta y asignar tus permisos de visualización antes de que puedas ingresar al Dashboard.'}
          </p>
          <button onClick={handleLogout} style={{ backgroundColor: COLORS.gris, color: COLORS.blanco, border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
            Cerrar Sesión y Volver
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER DEL DASHBOARD PRINCIPAL ---
  const renderHomeMenu = () => {
    // 1. Definimos todos los módulos posibles
    const allMenuItems = [
      { id: 'dotacion', label: 'Dotación', icon: <Users size={38} /> },
      { id: 'participacion', label: 'Participación Femenina', icon: <Venus size={38} /> },
      { id: 'sindicatos', label: 'Sindicatos', icon: <Handshake size={38} /> },
      { id: 'licencias', label: 'Licencias Médicas', icon: <Stethoscope size={38} /> },
      { id: 'ausentismo', label: 'Ausentismo y Sobretiempo', icon: <Scale size={38} /> },
      { id: 'discapacidad', label: 'Discapacidad', icon: <Accessibility size={38} /> },
      { id: 'cumpleanos', label: 'Cumpleaños', icon: <Gift size={38} /> },
      { id: 'comunas', label: 'Comunas', icon: <MapPin size={38} /> },
      { id: 'turnos', label: 'Calendario de Turnos', icon: <Clock size={38} /> },
      { id: 'buscador', label: 'Directorio y Jefaturas', icon: <Search size={38} /> },
    ];

    // 2. Filtramos según los permisos (Si es admin, los ve todos)
    const isAdmin = userProfile?.es_admin === true;
    const allowedModules = userProfile?.modulos_permitidos || [];
    
    let menuItems = allMenuItems.filter(item => isAdmin || allowedModules.includes(item.id));

    // 3. Si es Admin, inyectamos el botón del Panel de Control al principio
    if (isAdmin) {
      menuItems.unshift({ id: 'admin', label: 'Panel de Administración', icon: <Shield size={38} /> });
    }

    if (menuItems.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#fff', borderRadius: '12px', marginTop: '30px' }}>
          <p style={{ color: '#888', fontStyle: 'italic' }}>No tienes módulos asignados. Contacta al administrador.</p>
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 30vw, 320px), 1fr))', gap: '20px', marginTop: '30px' }}>
        {menuItems.map((item: any) => (
          <button key={item.id} onClick={() => handleTabChange(item.id)} style={{...gridButtonStyle, borderTop: item.id === 'admin' ? `4px solid ${COLORS.naranjo}` : '1px solid #eee' }}>
            <div style={{ color: item.id === 'admin' ? COLORS.naranjo : COLORS.celeste, marginBottom: '12px' }}>{item.icon}</div>
            <span style={{ fontSize: 'clamp(0.9rem, 2vw, 1.15rem)', fontWeight: 600, color: COLORS.gris, textAlign: 'center' }}>{item.label}</span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: COLORS.fondo, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      <Header />
      <div style={{ backgroundColor: COLORS.celeste, padding: '5px 20px', textAlign: 'right' }}>
         <span style={{ color: 'white', fontSize: '0.8rem', marginRight: '15px' }}>
           👤 {session.user.email} {userProfile?.es_admin && '(Admin)'}
         </span>
         <button onClick={handleLogout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.4)', color: 'white', borderRadius: '4px', padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>Cerrar Sesión</button>
      </div>
      
      <div style={{ maxWidth: '1300px', width: '100%', margin: '0 auto', padding: '30px 20px', flex: 1 }}>
        
        {isLoading && (
          <div style={{ textAlign: 'center', padding: '100px 0', color: COLORS.gris }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Descargando datos seguros...</h2>
            <p style={{ color: '#666' }}>Conectando con la bóveda cifrada</p>
          </div>
        )}

        {!isLoading && activeTab === 'home' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(6px, 1.5vw, 20px)', width: '100%', justifyContent: 'space-between', marginBottom: '25px' }}>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Dotación Total</h3>
                <p style={summaryValueStyle}>{globalSummary.total}</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Part. Femenina</h3>
                <p style={summaryValueStyle}>{globalSummary.mujeres}%</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Ausentismo</h3>
                <p style={summaryValueStyle}>{globalSummary.ausentismo}%</p>
              </div>
              <div style={summaryCardStyle}>
                <h3 style={summaryTitleStyle}>Sobretiempo</h3>
                <p style={summaryValueStyle}>{globalSummary.sobretiempo}%</p>
              </div>
            </div>

            <div style={{ borderBottom: `2px solid #ddd`, margin: '40px 0 20px 0', display: 'flex', alignItems: 'center' }}>
              <h2 style={{ color: COLORS.gris, fontSize: 'clamp(1.1rem, 2.5vw, 1.3rem)', fontWeight: 600, margin: 0, paddingBottom: '10px', borderBottom: `4px solid ${COLORS.naranjo}`, marginBottom: '-3px' }}>
                Módulos de Análisis
              </h2>
            </div>

            {renderHomeMenu()}
            
            <div style={{ marginTop: '50px', textAlign: 'center' }}>
              <p style={{ color: 'green', fontSize: '0.85rem', fontWeight: 600 }}>🔒 Conexión segura y cifrada activa (Supabase)</p>
            </div>
          </>
        )}

        {!isLoading && activeTab !== 'home' && (
          <div>
            <button onClick={() => handleTabChange('home')} style={backButtonStyle}>← Volver al Menú Principal</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', flexWrap: 'wrap' }}>
              <div style={{ color: COLORS.naranjo }}>
                {activeTab === 'participacion' ? <Venus size={32} /> : activeTab === 'sindicatos' ? <Handshake size={32} /> : activeTab === 'licencias' ? <Stethoscope size={32} /> : activeTab === 'ausentismo' ? <Scale size={32} /> : activeTab === 'discapacidad' ? <Accessibility size={32} /> : activeTab === 'cumpleanos' ? <Gift size={32} /> : activeTab === 'comunas' ? <MapPin size={32} /> : activeTab === 'turnos' ? <Clock size={32} /> : activeTab === 'buscador' ? <Search size={32} /> : activeTab === 'admin' ? <Shield size={32} /> : <Users size={32} />}
              </div>
              <h2 style={{ color: COLORS.gris, margin: 0, fontSize: 'clamp(1.4rem, 3vw, 1.8rem)', fontWeight: 600 }}>
                {activeTab === 'dotacion' ? 'Análisis Dotacional' : activeTab === 'participacion' ? 'Participación Femenina' : activeTab === 'sindicatos' ? 'Organizaciones Sindicales' : activeTab === 'licencias' ? 'Licencias Médicas' : activeTab === 'ausentismo' ? 'Ausentismo y Sobretiempo' : activeTab === 'discapacidad' ? 'Inclusión y Discapacidad' : activeTab === 'cumpleanos' ? 'Gestión de Cumpleaños' : activeTab === 'comunas' ? 'Distribución Geográfica' : activeTab === 'turnos' ? 'Calendario de Turnos' : activeTab === 'buscador' ? 'Directorio y Jefaturas' : activeTab === 'admin' ? 'Administración del Sistema' : activeTab.toUpperCase()}
              </h2>
            </div>
            
            {activeTab === 'admin' ? (
              <AdminTab />
            ) : activeTab === 'dotacion' ? (
              <DotacionTab rawData={rawData} stats={dotacionStats} />
            ) : activeTab === 'participacion' ? (
              <ParticipacionFemeninaTab rawData={rawData} />
            ) : activeTab === 'sindicatos' ? (
              <SindicatosTab rawData={rawData} />
            ) : activeTab === 'licencias' ? (
              <LicenciasTab rawData={licenciasData} dotacionData={rawData} />
            ) : activeTab === 'ausentismo' ? (
              <AusentismoTab rawData={ausentismoData} /> 
            ) : activeTab === 'discapacidad' ? (
              <DiscapacidadTab rawData={discapacidadData} /> 
            ) : activeTab === 'cumpleanos' ? (
              <CumplesTab rawData={rawData} /> 
            ) : activeTab === 'comunas' ? (
              <ComunasTab rawData={comunasSheetData} />
            ) : activeTab === 'turnos' ? (
              <TurnosTab />
            ) : activeTab === 'buscador' ? (
              <BuscadorTab dotacionData={rawData} jefaturaData={jefaturaData} />
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', backgroundColor: COLORS.blanco, borderRadius: '8px' }}>
                <p>Módulo de {activeTab} en desarrollo...</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

const summaryCardStyle: React.CSSProperties = { flex: '1 1 0px', minWidth: 'clamp(100px, 20vw, 200px)', backgroundColor: COLORS.blanco, padding: 'clamp(8px, 1.8vw, 20px) 4px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.04)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '110px', borderTop: `5px solid ${COLORS.celeste}` };
const summaryTitleStyle: React.CSSProperties = { margin: 0, color: '#666', fontSize: 'clamp(0.55rem, 1.3vw, 0.9rem)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const summaryValueStyle: React.CSSProperties = { fontSize: 'clamp(1.1rem, 3.2vw, 2.8rem)', fontWeight: 600, color: COLORS.celeste, margin: '6px 0 0 0' };
const gridButtonStyle: React.CSSProperties = { backgroundColor: COLORS.blanco, border: '1px solid #eee', borderRadius: '12px', padding: 'clamp(20px, 4vw, 45px) 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' };
const backButtonStyle: React.CSSProperties = { backgroundColor: 'transparent', border: 'none', color: COLORS.naranjo, fontWeight: 600, fontSize: '1rem', cursor: 'pointer', margin: '0 0 20px 0', padding: 0, display: 'flex', alignItems: 'center', gap: '5px' };
