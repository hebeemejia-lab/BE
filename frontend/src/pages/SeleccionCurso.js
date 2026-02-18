import React from 'react';
import { useNavigate } from 'react-router-dom';
import './SeleccionCurso.css';

const cursos = [
  {
    id: 1,
    nombre: 'Finanzas Personales',
    descripcion: 'Aprende a gestionar tus finanzas personales de manera efectiva.'
  },
  {
    id: 2,
    nombre: 'Inversiones Básicas',
    descripcion: 'Descubre los fundamentos de la inversión y haz crecer tu dinero.'
  },
  // Puedes agregar más cursos aquí
];

function SeleccionCurso() {
  const navigate = useNavigate();

  const handleSeleccion = (id) => {
    // Redirige a la página del curso seleccionado
    navigate(`/cursos/${id}`);
  };

  return (
    <div className="seleccion-curso-container">
      <h1>Selecciona tu Curso de Finanzas</h1>
      <div className="cursos-lista">
        {cursos.map((curso) => (
          <div key={curso.id} className="curso-card">
            <h2>{curso.nombre}</h2>
            <p>{curso.descripcion}</p>
            <button onClick={() => handleSeleccion(curso.id)}>
              Ir al curso
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SeleccionCurso;
