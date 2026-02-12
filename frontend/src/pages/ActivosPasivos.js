import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción a Activos y Pasivos',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>Bienvenido al curso de Activos y Pasivos de Banco Exclusivo. Aquí aprenderás a identificar, diferenciar y gestionar los activos y pasivos en tus finanzas personales y empresariales.</p>
        <p>Este conocimiento es fundamental para tomar mejores decisiones financieras y alcanzar tus metas económicas.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué es un Activo?',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Activos Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>Un <b>activo</b> es todo bien, recurso o derecho que posee una persona o empresa y que tiene un valor económico. Ejemplos: dinero en cuentas, propiedades, inversiones, vehículos, etc.</p>
        <ul>
          <li>Generan ingresos o aumentan su valor con el tiempo.</li>
          <li>Son clave para la salud financiera.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'pregunta',
    pregunta: {
      texto: '¿Cuál de los siguientes es un ejemplo de activo?',
      opciones: ['Préstamo bancario', 'Casa propia', 'Tarjeta de crédito', 'Factura por pagar'],
      correcta: 1
    }
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué es un Pasivo?',
    contenido: (
      <>
        <img src="/imagen/BE (14).png" alt="Pasivos Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>Un <b>pasivo</b> es una obligación o deuda que una persona o empresa debe pagar. Ejemplos: préstamos, hipotecas, tarjetas de crédito, deudas con proveedores, etc.</p>
        <ul>
          <li>Generan egresos o disminuyen el patrimonio.</li>
          <li>Es importante gestionarlos para evitar problemas financieros.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'pregunta',
    pregunta: {
      texto: '¿Qué es un pasivo?',
      opciones: ['Un bien que genera ingresos', 'Un recurso que aumenta de valor', 'Una obligación o deuda', 'Un tipo de inversión'],
      correcta: 2
    }
  },
  {
    tipo: 'lectura',
    titulo: 'Diferencias clave',
    contenido: (
      <>
        <img src="/imagen/BE (17).png" alt="Diferencias Banco Exclusivo" style={{maxWidth: 120, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <ul>
          <li><b>Activos</b> suman a tu riqueza, <b>pasivos</b> la restan.</li>
          <li>El objetivo es tener más activos que pasivos.</li>
        </ul>
        <p>Ejemplo: Una casa propia es un activo, una hipoteca es un pasivo.</p>
      </>
    )
  },
  {
    tipo: 'pregunta',
    pregunta: {
      texto: '¿Cuál es el objetivo financiero recomendado?',
      opciones: ['Tener más pasivos que activos', 'Tener igual cantidad de ambos', 'Tener más activos que pasivos', 'No tener ninguno'],
      correcta: 2
    }
  },
  {
    tipo: 'lectura',
    titulo: '¿Cómo mejorar tu balance?',
    contenido: (
      <>
        <img src="/imagen/BE (11).png" alt="Balance Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <ul>
          <li>Invierte en activos que generen ingresos.</li>
          <li>Reduce tus pasivos y evita deudas innecesarias.</li>
          <li>Haz un seguimiento mensual de tus activos y pasivos.</li>
        </ul>
        <p>Banco Exclusivo te ayuda a gestionar tus finanzas con herramientas y asesoría personalizada.</p>
      </>
    )
  }
];

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
