import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Quiz from '../components/Quiz';
import VideoBanco from '../components/VideoBanco';
import AnimacionBanco from '../components/AnimacionBanco';

const subtemas = [
  {
    tipo: 'lectura',
    titulo: 'Introducción: Beneficios del Ahorro',
    contenido: (
      <>
        <img src="/imagen/Diseño sin título (1) (1).png" alt="Banco Exclusivo" style={{maxWidth: 180, borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px #1a8cff33'}} />
        <p>El ahorro es la base de la estabilidad financiera. Permite enfrentar imprevistos, alcanzar metas y disfrutar de tranquilidad. Aprender a ahorrar y entender sus beneficios es esencial para cualquier persona.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: '¿Qué es el Ahorro?',
    contenido: (
      <>
        <p>El ahorro es la parte del ingreso que no se gasta y se reserva para el futuro. Puede ser en cuentas bancarias, inversiones, o incluso en bienes duraderos.</p>
        <ul>
          <li>Guardar una parte del salario cada mes en una cuenta de ahorros.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Beneficios del Ahorro',
    contenido: (
      <>
        <ul>
          <li>Seguridad ante imprevistos.</li>
          <li>Acceso a oportunidades de inversión.</li>
          <li>Reducción del estrés financiero.</li>
          <li>Alcance de metas personales (viajes, educación, vivienda).</li>
        </ul>
        <p>Consejos prácticos:</p>
        <ul>
          <li>Establece un presupuesto mensual.</li>
          <li>Automatiza el ahorro para evitar tentaciones de gasto.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Tipos de Ahorro',
    contenido: (
      <>
        <ul>
          <li>Ahorro de emergencia: para imprevistos.</li>
          <li>Ahorro para metas: viajes, estudios, vivienda.</li>
          <li>Ahorro para inversión: fondos, acciones, bienes raíces.</li>
        </ul>
        <p>Un fondo de emergencia debe cubrir al menos 3-6 meses de gastos.</p>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Estrategias para Ahorrar',
    contenido: (
      <>
        <ul>
          <li>Define metas claras y plazos.</li>
          <li>Usa herramientas digitales para controlar gastos.</li>
          <li>Elimina gastos innecesarios.</li>
          <li>Aprovecha productos bancarios con intereses atractivos.</li>
        </ul>
        <p>Consejos:</p>
        <ul>
          <li>Compara cuentas de ahorro y elige la que mejor se adapte a tus necesidades.</li>
          <li>Revisa tus gastos periódicamente.</li>
        </ul>
      </>
    )
  },
  {
    tipo: 'lectura',
    titulo: 'Contexto Actual',
    contenido: (
      <>
        <p>En 2026, la inflación y la volatilidad económica hacen que el ahorro sea más importante. Los bancos ofrecen productos innovadores como cuentas digitales, microahorros y fondos automatizados.</p>
        <ul>
          <li>Apps bancarias permiten redondear compras y ahorrar automáticamente.</li>
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
          <li>Calcula cuánto puedes ahorrar cada mes.</li>
          <li>Establece una meta de ahorro para los próximos 12 meses.</li>
          <li>Investiga productos bancarios que incentiven el ahorro.</li>
        </ul>
      </>
    )
  }
];

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
