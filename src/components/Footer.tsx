export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto', width: '100%', backgroundColor: '#f5f7f8' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'nowrap', // Evita que los logos salten a otra línea
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 'clamp(8px, 2vw, 10px) 15px',
        backgroundColor: '#0098aa',
        borderTopLeftRadius: '30px',
        gap: '10px'
      }}>
         <img 
           src="./Codelco_Ventanas.png" 
           alt="Codelco" 
           style={{ height: 'clamp(20px, 6vw, 35px)', width: 'auto', objectFit: 'contain' }} 
         />
         
         <div style={{ 
           flex: 1, 
           textAlign: 'center', 
           color: '#ffffff', 
           fontSize: 'clamp(0.6rem, 2vw, 0.85rem)', // Letras compactas
           lineHeight: 1.2
         }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Codelco División Ventanas</p>
            <p style={{ margin: 0 }}>Gerencia de Gestión de Personas</p>
         </div>
         
         <img 
           src="./5_valores.png" 
           alt="5 Valores" 
           style={{ height: 'clamp(20px, 6vw, 35px)', width: 'auto', objectFit: 'contain' }} 
         />
      </div>
      
      {/* Línea Inferior */}
      <div style={{ display: 'flex', height: '4px', width: '100%' }}>
        <div style={{ flex: 1, backgroundColor: '#0098aa' }}></div>
        <div style={{ flex: 1, backgroundColor: '#f4ab03' }}></div>
        <div style={{ flex: 1, backgroundColor: '#e45302' }}></div>
      </div>
    </footer>
  );
}
