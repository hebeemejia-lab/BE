import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    titulo: '¿Qué es una Economía Emergente?',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Economía Emergente Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?auto=format&fit=crop&w=600&q=80" alt="Economía Emergente" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <p>Una <b>economía emergente</b> es un país que está en proceso de rápido crecimiento e industrialización. Ejemplos: China, India, Brasil, México.</p>
        <ul>
          <li>Presentan oportunidades de inversión y crecimiento.</li>
          <li>Enfrentan desafíos como volatilidad y riesgos políticos.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Características principales',
    contenido: (
      <>
        <img src="/imagen/BE (17).png" alt="Características Banco Exclusivo" style={{maxWidth: 120, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80" alt="Características" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Crecimiento económico acelerado.</li>
          <li>Mayor apertura a mercados internacionales.</li>
          <li>Desarrollo de infraestructura y tecnología.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Oportunidades y riesgos',
    contenido: (
      <>
        <img src="/imagen/BE (14).png" alt="Oportunidades Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80" alt="Oportunidades y riesgos" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Oportunidades: crecimiento, nuevos mercados, innovación.</li>
          <li>Riesgos: inestabilidad política, fluctuaciones de moneda, regulaciones cambiantes.</li>
        </ul>
      </>
    )
  },
  {
    titulo: '¿Cómo invertir en economías emergentes?',
    contenido: (
      <>
        <img src="/imagen/BE (11).png" alt="Invertir Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Invertir" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Investiga el país y su contexto.</li>
          <li>Diversifica tus inversiones.</li>
          <li>Consulta expertos y mantente informado.</li>
        </ul>
      </>
    )
  }
];

export default function EconomiaEmergente() {
  const [pagina, setPagina] = useState(0);
  const [respuestas, setRespuestas] = useState([]);
  const navigate = useNavigate();

  const avanzar = () => {
    setPagina((prev) => prev + 1);
  };
  const retroceder = () => {
    if (pagina > 0) setPagina(pagina - 1);
  };

  const handleRespuesta = (opcion) => {
    setRespuestas([...respuestas, opcion]);
    avanzar();
  };

  if (pagina >= subtemas.length) {
    navigate('/certificado?curso=Economía%20Emergente');
    return null;
  }

  const actual = subtemas[pagina];
  return (
    <div className="curso-detalle" style={{maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 32}}>
      {actual.tipo === 'lectura' ? (
        <>
          <h2 style={{color: '#1a8cff'}}>{actual.titulo}</h2>
          <div style={{margin: '24px 0'}}>{actual.contenido}</div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <button onClick={retroceder} disabled={pagina === 0} style={{padding: '10px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: pagina === 0 ? '#ccc' : '#2d3e50', color: '#fff', cursor: pagina === 0 ? 'not-allowed' : 'pointer'}}>Anterior</button>
            <span>Página {pagina + 1} de {subtemas.length}</span>
            <button onClick={avanzar} style={{padding: '10px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: '#1a8cff', color: '#fff', cursor: 'pointer'}}>Siguiente</button>
          </div>
        </>
      ) : (
        <Quiz
          preguntas={[actual.pregunta]}
          onFinish={([opcion]) => handleRespuesta(opcion)}
        />
      )}
    </div>
  );
}
