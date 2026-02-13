import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Activos y Pasivos',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>En el mundo de las finanzas personales y bancarias, comprender la diferencia entre activos y pasivos es fundamental para tomar decisiones inteligentes sobre el dinero. Esta distinción es la base para construir riqueza, evitar deudas innecesarias y lograr estabilidad financiera.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué son los Activos?',
    contenido: (
      <>
        <p>Los activos son todos aquellos bienes, derechos o recursos que tienen valor y pueden generar ingresos o aumentar el patrimonio de una persona o empresa. Ejemplos incluyen dinero en cuentas de ahorro, propiedades, inversiones, vehículos, y hasta habilidades profesionales.</p>
        <ul>
          <li>Una casa propia es un activo porque puede aumentar de valor y, si se alquila, genera ingresos.</li>
          <li>Una cuenta de ahorros es un activo porque el dinero depositado puede crecer con intereses.</li>
        </ul>
        <p>Consejos prácticos:</p>
        <ul>
          <li>Invierte en activos que generen ingresos pasivos, como bienes raíces o fondos de inversión.</li>
          <li>Mantén un registro actualizado de tus activos para evaluar tu situación financiera.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué son los Pasivos?',
    contenido: (
      <>
        <p>Los pasivos son obligaciones o deudas que una persona o empresa debe pagar. Incluyen préstamos, tarjetas de crédito, hipotecas, y cualquier compromiso financiero que implique un desembolso futuro.</p>
        <ul>
          <li>Un préstamo bancario es un pasivo porque representa dinero que se debe devolver con intereses.</li>
          <li>Una tarjeta de crédito con saldo pendiente es un pasivo.</li>
        </ul>
        <p>Consejos prácticos:</p>
        <ul>
          <li>Evita acumular pasivos innecesarios, especialmente aquellos con altos intereses.</li>
          <li>Prioriza el pago de pasivos para reducir el estrés financiero.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Diferencias Clave entre Activos y Pasivos',
    contenido: (
      <>
        <table style={{width:'100%',margin:'16px 0',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:'#eaf6ff'}}>
              <th>Activos</th>
              <th>Pasivos</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Generan ingresos o aumentan el patrimonio</td>
              <td>Generan gastos o disminuyen el patrimonio</td>
            </tr>
            <tr>
              <td>Pueden apreciarse en valor</td>
              <td>Pueden generar intereses y deudas</td>
            </tr>
            <tr>
              <td>Ejemplo: inversiones, propiedades</td>
              <td>Ejemplo: préstamos, deudas</td>
            </tr>
          </tbody>
        </table>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Cómo Identificar Activos y Pasivos en tu Vida',
    contenido: (
      <>
        <p>Haz una lista de tus bienes y deudas. Pregúntate: ¿Esto me genera ingresos o me cuesta dinero? Así podrás clasificarlos correctamente.</p>
        <ul>
          <li>Tu auto: Si lo usas para trabajar y genera ingresos, es un activo. Si solo genera gastos, puede ser considerado un pasivo.</li>
          <li>Educación: Si te permite acceder a mejores empleos, es un activo intangible.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Estrategias para Maximizar Activos y Minimizar Pasivos',
    contenido: (
      <>
        <ul>
          <li>Invierte en educación, habilidades y bienes que generen valor.</li>
          <li>Reduce gastos innecesarios y deudas de alto interés.</li>
          <li>Revisa periódicamente tu balance personal.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Contexto Actual',
    contenido: (
      <>
        <p>En economías emergentes y en tiempos de incertidumbre, la gestión de activos y pasivos es más importante que nunca. La inflación, cambios en tasas de interés y volatilidad de mercados pueden afectar el valor de activos y el costo de pasivos.</p>
        <ul>
          <li>Diversifica tus activos para protegerte de riesgos.</li>
          <li>Negocia mejores condiciones para tus pasivos.</li>
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
          <li>Haz un inventario de tus activos y pasivos.</li>
          <li>Establece metas para aumentar tus activos y reducir tus pasivos en los próximos 12 meses.</li>
        </ul>
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
