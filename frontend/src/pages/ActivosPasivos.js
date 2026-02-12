import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    titulo: '¿Qué son los Activos?',
    contenido: (
      <>
        <img src="/imagen/BE (1) (1).png" alt="Activos Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80" alt="Activos" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <p>Un <b>activo</b> es todo bien, recurso o derecho que posee una persona o empresa y que tiene un valor económico. Ejemplos: dinero en cuentas, propiedades, inversiones, vehículos, etc.</p>
        <ul>
          <li>Generan ingresos o aumentan su valor con el tiempo.</li>
          <li>Son clave para la salud financiera.</li>
        </ul>
      </>
    )
  },
  {
    titulo: '¿Qué son los Pasivos?',
    contenido: (
      <>
        <img src="/imagen/BE (14).png" alt="Pasivos Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=600&q=80" alt="Pasivos" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <p>Un <b>pasivo</b> es una obligación o deuda que una persona o empresa debe pagar. Ejemplos: préstamos, hipotecas, tarjetas de crédito, deudas con proveedores, etc.</p>
        <ul>
          <li>Generan egresos o disminuyen el patrimonio.</li>
          <li>Es importante gestionarlos para evitar problemas financieros.</li>
        </ul>
      </>
    )
  },
  {
    titulo: 'Diferencias clave',
    contenido: (
      <>
        <img src="/imagen/BE (17).png" alt="Diferencias Banco Exclusivo" style={{maxWidth: 120, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1515168833906-d2a3b82b302b?auto=format&fit=crop&w=600&q=80" alt="Diferencias" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li><b>Activos</b> suman a tu riqueza, <b>pasivos</b> la restan.</li>
          <li>El objetivo es tener más activos que pasivos.</li>
        </ul>
        <p>Ejemplo: Una casa propia es un activo, una hipoteca es un pasivo.</p>
      </>
    )
  },
  {
    titulo: '¿Cómo mejorar tu balance?',
    contenido: (
      <>
        <img src="/imagen/BE (11).png" alt="Balance Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <img src="https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=600&q=80" alt="Balance" style={{maxWidth: 220, borderRadius: 12, marginBottom: 16, marginLeft: 16}} />
        <ul>
          <li>Invierte en activos que generen ingresos.</li>
          <li>Reduce tus pasivos y evita deudas innecesarias.</li>
          <li>Haz un seguimiento mensual de tus activos y pasivos.</li>
        </ul>
      </>
    )
  }
];

export default function ActivosPasivos() {
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
            <VideoBanco src="https://www.w3schools.com/html/mov_bbb.mp4" title="¿Qué es un activo?" />
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
              texto: '¿Cuál de los siguientes es un ejemplo de activo?',
              opciones: ['Préstamo bancario', 'Casa propia', 'Tarjeta de crédito', 'Factura por pagar'],
              correcta: 1
            },
            {
              texto: '¿Qué es un pasivo?',
              opciones: ['Un bien que genera ingresos', 'Un recurso que aumenta de valor', 'Una obligación o deuda', 'Un tipo de inversión'],
              correcta: 2
            },
            {
              texto: '¿Cuál es el objetivo financiero recomendado?',
              opciones: ['Tener más pasivos que activos', 'Tener igual cantidad de ambos', 'Tener más activos que pasivos', 'No tener ninguno'],
              correcta: 2
            }
          ]}
          onFinish={() => navigate('/certificado?curso=Activos%20y%20Pasivos')}
        />
      )}
    </div>
  );
}
