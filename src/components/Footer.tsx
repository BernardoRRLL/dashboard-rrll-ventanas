const COLORS = {
  gris: '#36424a',
  naranjo: '#e45302',
  celeste: '#0098aa',
  amarillo: '#f4ab03',
  rosado: '#C2185B',
  blanco: '#ffffff',
  fondoGris: '#f0f2f5'
};

export default function Footer() {
  return (
    <footer style={{ 
      width: '100%', 
      marginTop: 'auto', 
      backgroundColor: COLORS.fondoGris, 
      fontFamily: "'Poppins', sans-serif",
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Contenedor Principal del Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Bloque Izquierdo Celeste con corte diagonal */}
        <div style={{ 
          backgroundColor: COLORS.celeste, 
          padding: '15px 60px 15px 25px', // Ampliado para darle aire al logo más grande
          clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0% 100%)', 
          display: 'flex', 
          alignItems: 'center',
          minWidth: '320px' // Ensanchado para evitar que el corte ampute el logo
        }}>
          {/* Logo de Codelco aumentado significativamente */}
          <img src="/Codelco_Ventanas.png" alt="Codelco Ventanas" style={{ height: '55px', filter: 'brightness(0) invert(1)' }} />
        </div>

        {/* Bloque Central Textos */}
        <div style={{ flex: 1, padding: '0 20px' }}>
          <h4 style={{ margin: 0, color: COLORS.gris, fontSize: '1rem', fontWeight: 600 }}>
            Gerencia de Personas y Seguridad
          </h4>
          <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
            Codelco División Ventanas
          </p>
        </div>

        {/* Bloque Derecho Logo 5 Valores aumentado significativamente */}
        <div style={{ padding: '10px 30px' }}>
          <img src="/5_valores.png" alt="5 Valores que nos unen" style={{ height: '70px', objectFit: 'contain' }} />
        </div>

      </div>

      {/* Línea inferior corregida a 3 colores corporativos base */}
      <div style={{ display: 'flex', height: '6px', width: '100%' }}>
        <div style={{ flex: 1, backgroundColor: COLORS.celeste }}></div>
        <div style={{ flex: 1, backgroundColor: COLORS.amarillo }}></div>
        <div style={{ flex: 1, backgroundColor: COLORS.naranjo }}></div>
      </div>
      
    </footer>
  );
}