import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const baseSubtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Activos y Pasivos',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="BE" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>Definición de activos y pasivos. Importancia en la vida financiera personal y empresarial. Contexto actual: ¿Por qué es clave entenderlos en tiempos de incertidumbre económica?</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Tipos de Activos',
    contenido: (
      <>
        <p>Activos tangibles e intangibles. Ejemplos: bienes raíces, acciones, propiedad intelectual.</p>
        <ul>
          <li>Ejemplo: Identifica tus activos personales.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Tipos de Pasivos',
    contenido: (
      <>
        <p>Pasivos a corto y largo plazo. Ejemplos: préstamos, deudas de tarjetas, hipotecas.</p>
        <ul>
          <li>Ejemplo: Elabora una lista de tus pasivos.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Balance financiero: activos vs. pasivos',
    contenido: (
      <>
        <p>Cómo se relacionan activos y pasivos. Ejemplo: balance de una familia.</p>
        <ul>
          <li>Ejercicio: Calcula tu patrimonio neto.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Estrategias para aumentar activos',
    contenido: (
      <>
        <p>Inversión inteligente. Diversificación. Consejos: Cómo elegir activos según tu perfil.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Estrategias para reducir pasivos',
    contenido: (
      <>
        <p>Consolidación de deudas. Negociación de tasas. Ejercicio: Plan de reducción de pasivos.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Análisis de casos reales',
    contenido: (
      <>
        <p>Caso 1: Persona que invierte en bienes raíces.<br/>Caso 2: Empresa que reduce pasivos para crecer.</p>
        <ul>
          <li>Reflexión: ¿Qué aprendiste de estos casos?</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Herramientas y recursos',
    contenido: (
      <>
        <p>Apps de gestión financiera. Libros recomendados.</p>
        <ul>
          <li>Ejercicio: Prueba una app y comparte tu experiencia.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Ejercicios prácticos',
    contenido: (
      <>
        <p>Simulación de balance personal. Análisis de activos y pasivos de una empresa ficticia.</p>
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
        <p>Mantén actualizado tu balance. Revisa tus activos y pasivos periódicamente. Estrategias para el futuro financiero.</p>
      </>
    )
  }
];

const subtemas = [...baseSubtemas, ...baseSubtemas, ...baseSubtemas];

export default function ActivosPasivos() {
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

  // Al terminar el último subtema, mostrar certificado
  if (pagina >= subtemas.length) {
    navigate('/certificado?curso=Activos%20y%20Pasivos');
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
        <Quiz preguntas={[actual.pregunta]} onFinish={([opcion]) => handleRespuesta(opcion)} />
      )}
    </div>
  );
}
