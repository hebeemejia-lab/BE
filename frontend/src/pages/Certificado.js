import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import htmlToImage from 'html-to-image';

export default function Certificado() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const nombreCurso = params.get('curso') || 'Curso';
  const nombreUsuario = localStorage.getItem('nombreUsuario') || 'Nombre del Usuario';
  const ref = useRef();

  const descargarPNG = () => {
    if (!ref.current) return;
    htmlToImage.toPng(ref.current, { pixelRatio: 2 })
      .then(function (dataUrl) {
        const link = document.createElement('a');
        link.download = `certificado-${nombreCurso}.png`;
        link.href = dataUrl;
        link.click();
      });
  };

  return (
    <div className="certificado-container" style={{ textAlign: 'center', padding: 40, background: 'linear-gradient(135deg, #eaf6ff 0%, #f8f8f8 100%)' }}>
      <div ref={ref} style={{
        display: 'inline-block',
        border: '10px solid #1a8cff',
        borderRadius: 24,
        background: '#fff',
        padding: 48,
        minWidth: 540,
        maxWidth: 800,
        boxShadow: '0 8px 32px rgba(26,140,255,0.10)',
        position: 'relative',
        fontFamily: 'serif',
      }}>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{ width: 120, position: 'absolute', top: 32, left: 32 }} />
        <img src="/imagen/BE (17).png" alt="Sello" style={{ width: 80, position: 'absolute', bottom: 32, right: 32, opacity: 0.7 }} />
        <h1 style={{ color: '#1a8cff', marginBottom: 8, fontWeight: 700, fontSize: 36, letterSpacing: 1 }}>Banco Exclusivo</h1>
        <h2 style={{ color: '#2d3e50', marginBottom: 24, fontWeight: 400, fontSize: 28 }}>Certificado de Finalización</h2>
        <p style={{ fontSize: 20, margin: '32px 0 0 0', color: '#444' }}>Otorgado a</p>
        <h2 style={{ color: '#1a8cff', margin: 0, fontSize: 28, fontWeight: 600 }}>{nombreUsuario}</h2>
        <p style={{ fontSize: 20, margin: '32px 0 0 0', color: '#444' }}>por completar satisfactoriamente el curso</p>
        <h3 style={{ color: '#2d3e50', margin: 0, fontSize: 24 }}>{nombreCurso}</h3>
        <p style={{ margin: '40px 0 0 0', fontSize: 18, color: '#888' }}>Emitido por Banco Exclusivo • {new Date().toLocaleDateString()}</p>
        <div style={{ marginTop: 48, textAlign: 'right', color: '#1a8cff', fontWeight: 500, fontSize: 18 }}>
          <span>__________________________<br/>Director Académico</span>
        </div>
      </div>
      <div style={{ marginTop: 32 }}>
        <button onClick={() => window.print()} style={{ marginRight: 16, padding: '10px 24px', fontSize: 16, background: '#1a8cff', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Imprimir</button>
        <button onClick={descargarPNG} style={{ padding: '10px 24px', fontSize: 16, background: '#2d3e50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Descargar PNG</button>
      </div>
    </div>
  );
}
