export default function Header() {
  return (
    <header style={{ backgroundColor: '#36424a', width: '100%', boxSizing: 'border-box' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap', 
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(10px, 2vw, 15px) 4%', // 4% empuja a los bordes sin pegar
        maxWidth: '100%', // Libera el ancho restringido anterior
        margin: '0 auto',
        gap: '15px',
        boxSizing: 'border-box'
      }}>
        <img 
          src="./Codelco_Ventanas.png" 
          alt="Codelco" 
          style={{ height: 'clamp(30px, 6vw, 60px)', maxWidth: '25vw', objectFit: 'contain' }} 
        />
        
        <h1 style={{ 
          color: '#ffffff', 
          margin: 0, 
          fontSize: 'clamp(1.1rem, 3.5vw, 2.2rem)', 
          fontWeight: 600, 
          textAlign: 'center', 
          flex: '1 1 auto', 
          minWidth: '200px', // Fuerza el salto de línea ordenado si la pantalla es extrema
          lineHeight: 1.1
        }}>
          Relaciones Laborales
        </h1>
        
        <img 
          src="./somos_protagonistas.png" 
          alt="Somos Protagonistas" 
          style={{ height: 'clamp(30px, 6vw, 60px)', maxWidth: '25vw', objectFit: 'contain' }} 
        />
      </div>
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%', boxSizing: 'border-box' }}></div>
    </header>
  );
}
