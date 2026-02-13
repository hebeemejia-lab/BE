import React, { useRef, useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import * as htmlToImage from 'html-to-image';

// Estilos globales para impresión y centrado
const printStyles = `
  @media print {
    body * {
      visibility: hidden !important;
    }
    #certificado-print {
      visibility: visible !important;
      position: absolute !important;
      left: 0; right: 0; top: 0; margin: auto !important;
      width: 816px !important;
      height: 1056px !important;
      box-shadow: none !important;
      background: #1a8cff !important;
      color: #fff !important;
      border: none !important;
      outline: none !important;
    }
    #certificado-print * {
      color: #fff !important;
      background: transparent !important;
      text-shadow: none !important;
    }
    .certificado-container, .certificado-container * {
      background: transparent !important;
      color: #fff !important;
    }
    input, button, .no-print {
      display: none !important;
    }
  }
`;


export default function Certificado() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const nombreCurso = params.get('curso') || 'Curso';
  const { usuario } = useContext(AuthContext);
  // Si el usuario está autenticado, usar nombre y apellido de la cuenta
  const nombreCompletoUsuario = usuario && usuario.nombre && usuario.apellido
    ? `${usuario.nombre} ${usuario.apellido}`
    : null;
  const [nombre, setNombre] = useState(
    nombreCompletoUsuario || localStorage.getItem('nombreUsuario') || 'Nombre del Usuario'
  );
  const ref = useRef();

  // Si el usuario inicia sesión después de renderizar, actualizar el nombre automáticamente
  useEffect(() => {
    if (nombreCompletoUsuario && nombre !== nombreCompletoUsuario) {
      setNombre(nombreCompletoUsuario);
    }
    // eslint-disable-next-line
  }, [nombreCompletoUsuario]);

  useEffect(() => {
    if (nombre && nombre !== 'Nombre del Usuario') {
      localStorage.setItem('nombreUsuario', nombre);
    }
  }, [nombre]);

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
    <div>
      <style>{printStyles}</style>
      <div className="certificado-container" style={{ textAlign: 'center', padding: 40, background: 'linear-gradient(135deg, #1a8cff 0%, #2d3e50 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {/* Campo de edición y botones solo visibles en web, nunca en impresión */}
        {!window.matchMedia('print').matches && (
          <div className="no-print" style={{ marginBottom: 32 }}>
            <h2 style={{ color: '#fff' }}>Nombre para el certificado:</h2>
            <input
              type="text"
              value={nombre === 'Nombre del Usuario' ? '' : nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Nombre del Usuario"
              style={{ padding: '12px', fontSize: 18, borderRadius: 8, border: '1px solid #fff', width: 320, marginTop: 8, color: '#1a8cff', background: '#fff' }}
            />
            <small style={{ color: '#fff', marginTop: 8, display: 'block' }}>Puedes editar el nombre que aparecerá en el certificado.</small>
          </div>
        )}
        <div ref={ref} id="certificado-print" style={{
          display: 'inline-block',
          background: '#1a8cff',
          padding: 48,
          minWidth: 816,
          minHeight: 1056,
          width: 816,
          height: 1056,
          maxWidth: 816,
          maxHeight: 1056,
          boxShadow: '0 8px 32px rgba(26,140,255,0.10)',
          position: 'relative',
          fontFamily: 'serif',
          overflow: 'hidden',
          borderRadius: 32,
          border: '8px solid #fff',
          outline: '6px solid #fff',
          outlineOffset: '-12px',
          color: '#fff',
          margin: '0 auto',
        }}>
          <img src={process.env.PUBLIC_URL + '/imagen/Diseño sin título (1) (1).png'} alt="Banco Exclusivo" style={{ width: 120, position: 'absolute', top: 32, left: 32, zIndex: 1 }} />
          {/* Bordes académicos decorativos */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <svg width="100%" height="100%" viewBox="0 0 816 1056" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', top: 0, left: 0 }}>
              <rect x="16" y="16" width="784" height="1024" rx="24" stroke="#fff" strokeWidth="6" fill="none" />
              <rect x="32" y="32" width="752" height="992" rx="18" stroke="#ffd700" strokeWidth="4" fill="none" />
              <rect x="48" y="48" width="720" height="960" rx="12" stroke="#1a8cff" strokeWidth="2" fill="none" />
            </svg>
          </div>
          <h1 style={{ color: '#fff', marginBottom: 8, fontWeight: 700, fontSize: 36, letterSpacing: 1, position: 'relative', zIndex: 2 }}>Banco Exclusivo</h1>
          <h2 style={{ color: '#fff', marginBottom: 24, fontWeight: 400, fontSize: 28, position: 'relative', zIndex: 2 }}>Certificado de Finalización</h2>
          <p style={{ fontSize: 20, margin: '32px 0 0 0', color: '#fff', position: 'relative', zIndex: 2 }}>Otorgado a</p>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 28, fontWeight: 600, position: 'relative', zIndex: 2 }}>{nombre}</h2>
          <p style={{ fontSize: 20, margin: '32px 0 0 0', color: '#fff', position: 'relative', zIndex: 2 }}>por completar satisfactoriamente el curso</p>
          <h3 style={{ color: '#fff', margin: 0, fontSize: 24, position: 'relative', zIndex: 2 }}>{nombreCurso}</h3>
          <p style={{ margin: '40px 0 0 0', fontSize: 18, color: '#fff', position: 'relative', zIndex: 2 }}>Emitido por Banco Exclusivo • {new Date().toLocaleDateString()}</p>
          <div style={{ marginTop: 48, textAlign: 'center', color: '#fff', fontWeight: 500, fontSize: 18, position: 'relative', zIndex: 2 }}>
            <span>__________________________<br/>Heber Mejire Jacobe (Heber Renuel)<br/>Director Académico</span>
          </div>
        </div>
        {!window.matchMedia('print').matches && (
          <div className="no-print" style={{ marginTop: 32 }}>
            <button onClick={() => window.print()} style={{ marginRight: 16, padding: '10px 24px', fontSize: 16, background: '#fff', color: '#1a8cff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Imprimir</button>
            <button onClick={descargarPNG} style={{ padding: '10px 24px', fontSize: 16, background: '#2d3e50', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Descargar PNG</button>
          </div>
        )}
      </div>
    </div>
  );
}
