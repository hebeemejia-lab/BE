import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const baseSubtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Economía Emergente',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>¿Qué es una economía emergente? Contexto global: países emergentes y su impacto.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Características de las economías emergentes',
    contenido: (
      <>
        <p>Crecimiento acelerado. Volatilidad y riesgos. Ejemplo: Brasil, India, México.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Oportunidades de inversión',
    contenido: (
      <>
        <p>Sectores clave: tecnología, energía, infraestructura.</p>
        <ul>
          <li>Caso práctico: Analiza una oportunidad de inversión en un país emergente.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Riesgos y desafíos',
    contenido: (
      <>
        <p>Inestabilidad política. Fluctuaciones de moneda.</p>
        <ul>
          <li>Ejercicio: Identifica riesgos en un país emergente.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Estrategias para invertir',
    contenido: (
      <>
        <p>Diversificación geográfica. Fondos de inversión especializados. Consejos: Cómo evaluar el riesgo.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Análisis de casos reales',
    contenido: (
      <>
        <p>Caso 1: Inversión exitosa en India.<br/>Caso 2: Fracaso por volatilidad en Turquía.</p>
        <ul>
          <li>Reflexión: ¿Qué factores influyeron?</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Contexto actual y tendencias',
    contenido: (
      <>
        <p>Impacto de la tecnología. Sostenibilidad y economía verde.</p>
        <ul>
          <li>Ejercicio: Investiga una tendencia actual.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Herramientas y recursos',
    contenido: (
      <>
        <p>Plataformas de inversión internacional. Informes económicos.</p>
        <ul>
          <li>Ejercicio: Consulta un informe y resume hallazgos.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Ejercicios prácticos',
    contenido: (
      <>
        <p>Simulación de portafolio en economía emergente. Análisis de riesgos y oportunidades.</p>
        <ul>
          <li>Recomendaciones para mejorar resultados.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Consejos finales y recomendaciones',
    contenido: (
      <>
        <p>Mantente informado sobre cambios globales. Consulta expertos antes de invertir. Estrategias para minimizar riesgos.</p>
      </>
    )
  }
];

const subtemas = [...baseSubtemas, ...baseSubtemas, ...baseSubtemas];

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
