import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Economía Emergente',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>Las economías emergentes son países o regiones que están en proceso de crecimiento y desarrollo económico. Entender cómo funcionan, sus oportunidades y desafíos, es clave para tomar decisiones financieras acertadas.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué es una Economía Emergente?',
    contenido: (
      <>
        <p>Una economía emergente es aquella que está transitando de ser un país en vías de desarrollo a uno más avanzado, con mercados financieros en expansión, mayor industrialización y crecimiento del PIB.</p>
        <ul>
          <li>Brasil, México, India y China son ejemplos de economías emergentes.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Características de las Economías Emergentes',
    contenido: (
      <>
        <ul>
          <li>Crecimiento rápido del PIB.</li>
          <li>Expansión de mercados financieros.</li>
          <li>Mayor acceso a tecnología y educación.</li>
          <li>Volatilidad económica y política.</li>
        </ul>
        <p>Consejos prácticos:</p>
        <ul>
          <li>Aprovecha oportunidades de inversión en sectores en crecimiento.</li>
          <li>Mantente informado sobre cambios regulatorios y políticos.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Oportunidades en Economías Emergentes',
    contenido: (
      <>
        <ul>
          <li>Inversiones en infraestructura, tecnología y energía.</li>
          <li>Crecimiento de la clase media y consumo interno.</li>
          <li>Innovación y emprendimiento.</li>
        </ul>
        <p>Ejemplo: Startups tecnológicas en India han crecido exponencialmente en la última década.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Desafíos y Riesgos',
    contenido: (
      <>
        <ul>
          <li>Volatilidad de monedas y mercados.</li>
          <li>Riesgo político y regulatorio.</li>
          <li>Desigualdad social y acceso limitado a servicios financieros.</li>
        </ul>
        <p>Consejos:</p>
        <ul>
          <li>Diversifica tus inversiones.</li>
          <li>Evalúa el riesgo país antes de invertir.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Contexto Actual',
    contenido: (
      <>
        <p>En 2026, las economías emergentes enfrentan retos como inflación, cambios en tasas de interés globales y adaptación a nuevas tecnologías. Sin embargo, siguen siendo motores de crecimiento mundial.</p>
        <ul>
          <li>La digitalización bancaria ha permitido mayor inclusión financiera en América Latina.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Impacto en Finanzas Personales',
    contenido: (
      <>
        <ul>
          <li>Acceso a nuevos productos financieros.</li>
          <li>Oportunidades de empleo y emprendimiento.</li>
          <li>Cambios en hábitos de consumo.</li>
        </ul>
        <p>Consejos:</p>
        <ul>
          <li>Aprovecha la digitalización para acceder a servicios bancarios innovadores.</li>
          <li>Considera inversiones en sectores emergentes.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Ejercicios y Reflexión',
    contenido: (
      <>
        <ul>
          <li>Investiga un sector en crecimiento en tu país.</li>
          <li>Analiza cómo la economía emergente afecta tus decisiones financieras.</li>
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
