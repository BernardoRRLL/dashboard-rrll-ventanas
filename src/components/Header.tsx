const COLORS = {
  gris: '#36424A',
  naranjo: '#e45302',
  blanco: '#ffffff'
};

export default function Header() {
  return (
    <header style={{ 
      backgroundColor: COLORS.gris, 
      borderBottom: `4px solid ${COLORS.naranjo}`, 
      padding: '12px 20px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      fontFamily: "'Poppins', sans-serif"
    }}>
      {/* Logo de Codelco agrandado a 75px */}
      <img src="/Codelco_Ventanas.png" alt="Codelco Ventanas" style={{ height: '75px', objectFit: 'contain' }} />
      
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: COLORS.blanco, margin: 0, fontSize: '1.4rem', fontWeight: 600, letterSpacing: '0.5px' }}>
          Codelco División Ventanas
        </h1>
        <p style={{ color: COLORS.blanco, margin: '2px 0 0 0', fontSize: '0.95rem', fontWeight: 400, opacity: 0.9 }}>
          Relaciones Laborales
        </p>
      </div>
      
      <img src="/somos_protagonistas.png" alt="Somos Protagonistas" style={{ height: '50px', objectFit: 'contain' }} />
    </header>
  );
}