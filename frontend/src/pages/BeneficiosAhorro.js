import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    titulo: '¿Por qué ahorrar?',
    contenido: (
      <>
        <img src="/imagen/BE (1) (1).png" alt="Ahorro Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80" alt="Ahorro" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <p>El <b>ahorro</b> es la base de unas finanzas sanas. Permite enfrentar imprevistos, alcanzar metas y vivir con tranquilidad.</p>
        <ul>
          <li>Te da seguridad ante emergencias.</li>
          <li>Facilita la inversión y el crecimiento personal.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Ventajas del ahorro',
    contenido: (
      <>
        <img src="/imagen/BE (17).png" alt="Ventajas Banco Exclusivo" style={{maxWidth: 120, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=600&q=80" alt="Ventajas" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Reduce el estrés financiero.</li>
          <li>Permite aprovechar oportunidades.</li>
          <li>Ayuda a evitar deudas innecesarias.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Estrategias para ahorrar',
    contenido: (
      <>
        <img src="/imagen/BE (14).png" alt="Estrategias Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80" alt="Estrategias" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Define metas claras y realistas.</li>
          <li>Automatiza tu ahorro cada mes.</li>
          <li>Reduce gastos innecesarios.</li>
        </ul>
      </>
    )
  },
  {
    titulo: '¿Cómo empezar hoy?',
    contenido: (
      <>
        <img src="/imagen/BE (11).png" alt="Empezar Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1465101178521-c1a9136a3b41?auto=format&fit=crop&w=600&q=80" alt="Empezar" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Abre una cuenta de ahorro.</li>
          <li>Haz un presupuesto mensual.</li>
          <li>Revisa tus progresos y celebra tus logros.</li>
        </ul>
      </>
    )
  }
];

export default function BeneficiosAhorro() {
  const [pagina, setPagina] = useState(0);
  const navigate = useNavigate();

  const [mostrarQuiz, setMostrarQuiz] = useState(false);
  const avanzar = () => {
    if (pagina < subtemas.length - 1) setPagina(pagina + 1);
    else setMostrarQuiz(true);
  };
  const retroceder = () => {
    if (pagina > 0) setPagina(pagina - 1);
  };

  return (
    <div className="curso-detalle" style={{maxWidth: 700, margin: '0 auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001', padding: 32}}>
      {!mostrarQuiz ? (
        <>
          <h2 style={{color: '#1a8cff'}}>{subtemas[pagina].titulo}</h2>
          <div style={{margin: '24px 0'}}>{subtemas[pagina].contenido}</div>
          {pagina === 0 && (
            <VideoBanco src="https://www.w3schools.com/html/mov_bbb.mp4" title="¿Por qué ahorrar?" />
          )}
          {pagina === 2 && (
            <AnimacionBanco />
          )}
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <button onClick={retroceder} disabled={pagina === 0} style={{padding: '10px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: pagina === 0 ? '#ccc' : '#2d3e50', color: '#fff', cursor: pagina === 0 ? 'not-allowed' : 'pointer'}}>Anterior</button>
            <span>Página {pagina + 1} de {subtemas.length}</span>
            <button onClick={avanzar} style={{padding: '10px 24px', fontSize: 16, borderRadius: 6, border: 'none', background: '#1a8cff', color: '#fff', cursor: 'pointer'}}>{pagina === subtemas.length - 1 ? 'Finalizar' : 'Siguiente'}</button>
          </div>
        </>
      ) : (
        <Quiz
          preguntas={[
            {
              texto: '¿Cuál es un beneficio del ahorro?',
              opciones: ['Aumenta el estrés', 'Permite enfrentar emergencias', 'Genera más deudas', 'Reduce oportunidades'],
              correcta: 1
            },
            {
              texto: '¿Qué estrategia ayuda a ahorrar?',
              opciones: ['Gastar sin control', 'Automatizar el ahorro', 'No tener metas', 'Evitar presupuestos'],
              correcta: 1
            },
            {
              texto: '¿Por qué es importante revisar tus progresos?',
              opciones: ['Para celebrar logros', 'Para gastar más', 'Para endeudarse', 'No es importante'],
              correcta: 0
            }
          ]}
          onFinish={() => navigate('/certificado?curso=Beneficios%20del%20Ahorro')}
        />
      )}
    </div>
  );
}
