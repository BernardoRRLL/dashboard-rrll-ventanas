export default function Footer() {
  return (
    <footer style={{ marginTop: 'auto', width: '100%', backgroundColor: '#f5f7f8' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',           // <--- CLAVE PARA CELULAR
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 20px',       // <--- PADDING REDUCIDO
        backgroundColor: '#0098aa',
        borderTopLeftRadius: '30px',
        gap: '15px'
      }}>
         <img 
           src="./Codelco Ventanas.png" 
           alt="Codelco" 
           style={{ height: 'auto', maxHeight: '35px', maxWidth: '100%', objectFit: 'contain' }} 
         />
         
         <div style={{ 
           flex: '1 1 200px', 
           textAlign: 'center', 
           color: '#ffffff', 
           fontSize: 'clamp(0.7rem, 2vw, 0.85rem)' // <--- LETRA MÁS PEQUEÑA
         }}>
            <p style={{ margin: 0, fontWeight: 600 }}>Codelco División Ventanas</p>
            <p style={{ margin: 0 }}>Gerencia de Gestión de Personas</p>
         </div>
         
         <img 
           src="./5_valores.png" 
           alt="5 Valores" 
           style={{ height: 'auto', maxHeight: '35px', maxWidth: '100%', objectFit: 'contain' }} 
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
