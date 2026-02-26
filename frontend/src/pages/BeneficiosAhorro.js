import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';

const baseSubtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Beneficios del Ahorro',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="BE" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>¿Por qué ahorrar? Contexto actual: inflación, incertidumbre.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Tipos de ahorro',
    contenido: (
      <>
        <p>Ahorro a corto, mediano y largo plazo. Ejemplo: fondo de emergencia, ahorro para retiro.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Métodos y estrategias de ahorro',
    contenido: (
      <>
        <p>Presupuesto personal. Automatización del ahorro.</p>
        <ul>
          <li>Ejercicio: Crea tu propio presupuesto.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Herramientas para ahorrar',
    contenido: (
      <>
        <p>Apps y bancos digitales. Cuentas de ahorro especializadas.</p>
        <ul>
          <li>Ejercicio: Compara diferentes opciones.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Análisis de casos reales',
    contenido: (
      <>
        <p>Caso 1: Persona que ahorra para un viaje.<br/>Caso 2: Familia que crea un fondo de emergencia.</p>
        <ul>
          <li>Reflexión: ¿Qué estrategias funcionaron?</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Beneficios tangibles e intangibles',
    contenido: (
      <>
        <p>Seguridad financiera. Reducción de estrés. Ejemplo: Impacto del ahorro en la salud mental.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Obstáculos y cómo superarlos',
    contenido: (
      <>
        <p>Consumo impulsivo. Falta de disciplina.</p>
        <ul>
          <li>Consejos: Técnicas para evitar gastos innecesarios.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Ejercicios prácticos',
    contenido: (
      <>
        <p>Simulación de ahorro mensual. Análisis de gastos y oportunidades de ahorro.</p>
        <ul>
          <li>Recomendaciones para mejorar resultados.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Contexto actual y tendencias',
    contenido: (
      <>
        <p>Nuevas formas de ahorrar: fintech, criptomonedas.</p>
        <ul>
          <li>Ejercicio: Investiga una tendencia y comparte tu opinión.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Consejos finales y recomendaciones',
    contenido: (
      <>
        <p>Revisa tu plan de ahorro periódicamente. Ajusta según tus metas y contexto. Estrategias para mantener la motivación.</p>
      </>
    )
  }
];

const subtemas = [...baseSubtemas, ...baseSubtemas, ...baseSubtemas];

export default function BeneficiosAhorro() {
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
    navigate('/certificado?curso=Beneficios%20del%20Ahorro');
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
