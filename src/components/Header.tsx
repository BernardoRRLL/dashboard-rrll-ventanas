export default function Header() {
  return (
    <header style={{ backgroundColor: '#36424a', width: '100%' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap', // Obliga a mantener todo en 1 sola línea
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(10px, 2vw, 15px) 15px', // Achica el padding en celular
        maxWidth: '1300px',
        margin: '0 auto',
        gap: '10px'
      }}>
        <img 
          src="./Codelco_Ventanas.png" 
          alt="Codelco" 
          style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
        />
        
        <h1 style={{ 
          color: '#ffffff', 
          margin: 0, 
          fontSize: 'clamp(1rem, 4vw, 2.2rem)', // Se achica dramáticamente en celular
          fontWeight: 600, 
          textAlign: 'center', 
          flex: 1,
          lineHeight: 1.1
        }}>
          Relaciones Laborales
        </h1>
        
        <img 
          src="./somos_protagonistas.png" 
          alt="Somos Protagonistas" 
          style={{ height: 'clamp(30px, 8vw, 60px)', width: 'auto', objectFit: 'contain' }} 
        />
      </div>
      <div style={{ height: '5px', backgroundColor: '#e45302', width: '100%' }}></div>
    </header>
  );
}
