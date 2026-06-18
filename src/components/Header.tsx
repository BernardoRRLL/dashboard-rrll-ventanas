export default function Header() {
  return (
    <header style={{ backgroundColor: '#36424a', width: '100%' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',           // <--- CLAVE PARA CELULAR
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '15px 20px',
        maxWidth: '1300px',
        margin: '0 auto',
        gap: '15px'
      }}>
        <img 
          src="./Codelco Ventanas.png" 
          alt="Codelco" 
          style={{ height: 'auto', maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} 
        />
        
        <h1 style={{ 
          color: '#ffffff', 
          margin: 0, 
          // clamp(min, ideal, max) adapta la fuente al tamaño de la pantalla
          fontSize: 'clamp(1.2rem, 3vw, 2.2rem)', 
          fontWeight: 600, 
          textAlign: 'center', 
          flex: '1 1 250px' 
        }}>
          Relaciones Laborales
        </h1>
        
        <img 
          src="./somos protagonistas.png" 
          alt="Somos Protagonistas" 
          style={{ height: 'auto', maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} 
        />
      </div>
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%' }}></div>
    </header>
  );
}
