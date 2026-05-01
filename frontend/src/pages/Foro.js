import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { forumAPI } from '../services/api';
import './Foro.css';

const formatFecha = (value) => {
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) {
    return '';
  }
  return fecha.toLocaleString('es-DO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function Foro() {
  const [temas, setTemas] = useState([]);
  const [temaSeleccionado, setTemaSeleccionado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoTema, setCargandoTema] = useState(false);
  const [error, setError] = useState('');

  const [nuevoTema, setNuevoTema] = useState({ titulo: '', contenido: '' });
  const [nuevaRespuesta, setNuevaRespuesta] = useState('');
  const [guardandoTema, setGuardandoTema] = useState(false);
  const [guardandoRespuesta, setGuardandoRespuesta] = useState(false);

  const temaActivoId = useMemo(() => temaSeleccionado?.id || null, [temaSeleccionado]);

  const cargarTemas = useCallback(async () => {
    try {
      setCargando(true);
      setError('');
      const response = await forumAPI.listarTemas();
      const lista = Array.isArray(response.data?.temas) ? response.data.temas : [];
      setTemas(lista);

      if (!temaActivoId && lista.length > 0) {
        setTemaSeleccionado(lista[0]);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cargar el foro.');
    } finally {
      setCargando(false);
    }
  }, [temaActivoId]);

  const cargarTema = async (temaId) => {
    if (!temaId) {
      return;
    }
    try {
      setCargandoTema(true);
      setError('');
      const response = await forumAPI.obtenerTema(temaId);
      setTemaSeleccionado(response.data?.tema || null);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo cargar el tema.');
    } finally {
      setCargandoTema(false);
    }
  };

  useEffect(() => {
    cargarTemas();
  }, [cargarTemas]);

  useEffect(() => {
    if (temaActivoId) {
      cargarTema(temaActivoId);
    }
  }, [temaActivoId]);

  const handleCrearTema = async (e) => {
    e.preventDefault();
    try {
      setGuardandoTema(true);
      setError('');
      const payload = {
        titulo: nuevoTema.titulo,
        contenido: nuevoTema.contenido,
      };
      const response = await forumAPI.crearTema(payload);
      const temaCreado = response.data?.tema;

      setNuevoTema({ titulo: '', contenido: '' });
      await cargarTemas();

      if (temaCreado?.id) {
        await cargarTema(temaCreado.id);
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo crear el tema.');
    } finally {
      setGuardandoTema(false);
    }
  };

  const handleResponder = async (e) => {
    e.preventDefault();
    if (!temaSeleccionado?.id) {
      return;
    }

    try {
      setGuardandoRespuesta(true);
      setError('');
      await forumAPI.crearRespuesta(temaSeleccionado.id, { contenido: nuevaRespuesta });
      setNuevaRespuesta('');
      await Promise.all([cargarTema(temaSeleccionado.id), cargarTemas()]);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'No se pudo publicar la respuesta.');
    } finally {
      setGuardandoRespuesta(false);
    }
  };

  return (
    <div className="foro-page">
      <header className="foro-header">
        <h1>Foro Comunidad BE</h1>
        <p>Comparte ideas, preguntas y respuestas con otros miembros.</p>
      </header>

      {error && <div className="foro-alert">{error}</div>}

      <section className="foro-crear">
        <h2>Crear nuevo tema</h2>
        <form onSubmit={handleCrearTema} className="foro-form">
          <input
            type="text"
            placeholder="Titulo del tema"
            value={nuevoTema.titulo}
            onChange={(e) => setNuevoTema((prev) => ({ ...prev, titulo: e.target.value }))}
            maxLength={160}
            required
          />
          <textarea
            placeholder="Describe tu pregunta o aporte"
            value={nuevoTema.contenido}
            onChange={(e) => setNuevoTema((prev) => ({ ...prev, contenido: e.target.value }))}
            rows={4}
            required
          />
          <button type="submit" disabled={guardandoTema}>
            {guardandoTema ? 'Publicando...' : 'Publicar tema'}
          </button>
        </form>
      </section>

      <section className="foro-layout">
        <aside className="foro-sidebar">
          <h2>Temas recientes</h2>
          {cargando ? (
            <p className="foro-empty">Cargando temas...</p>
          ) : temas.length === 0 ? (
            <p className="foro-empty">No hay temas todavia.</p>
          ) : (
            <ul className="foro-lista-temas">
              {temas.map((tema) => (
                <li key={tema.id}>
                  <button
                    type="button"
                    className={`foro-tema-btn ${temaSeleccionado?.id === tema.id ? 'activo' : ''}`}
                    onClick={() => setTemaSeleccionado(tema)}
                  >
                    <strong>{tema.titulo}</strong>
                    <span>{tema.autor?.nombre || 'Usuario'} · {formatFecha(tema.createdAt)}</span>
                    <small>{tema.respuestasCount || 0} respuesta(s)</small>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <article className="foro-detalle">
          {!temaSeleccionado ? (
            <p className="foro-empty">Selecciona un tema para ver su conversacion.</p>
          ) : cargandoTema ? (
            <p className="foro-empty">Cargando tema...</p>
          ) : (
            <>
              <div className="foro-tema-principal">
                <h3>{temaSeleccionado.titulo}</h3>
                <p className="foro-meta">
                  Publicado por {temaSeleccionado.autor?.nombre || 'Usuario'} {temaSeleccionado.autor?.apellido || ''}
                  {' · '}
                  {formatFecha(temaSeleccionado.createdAt)}
                </p>
                <p>{temaSeleccionado.contenido}</p>
              </div>

              <div className="foro-respuestas">
                <h4>Respuestas</h4>
                {(temaSeleccionado.respuestas || []).length === 0 ? (
                  <p className="foro-empty">Aun no hay respuestas en este tema.</p>
                ) : (
                  <ul>
                    {(temaSeleccionado.respuestas || []).map((respuesta) => (
                      <li key={respuesta.id} className="foro-respuesta-item">
                        <p>{respuesta.contenido}</p>
                        <span>
                          {respuesta.autor?.nombre || 'Usuario'} {respuesta.autor?.apellido || ''}
                          {' · '}
                          {formatFecha(respuesta.createdAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <form onSubmit={handleResponder} className="foro-form respuesta-form">
                <textarea
                  placeholder="Escribe una respuesta"
                  value={nuevaRespuesta}
                  onChange={(e) => setNuevaRespuesta(e.target.value)}
                  rows={3}
                  required
                />
                <button type="submit" disabled={guardandoRespuesta}>
                  {guardandoRespuesta ? 'Enviando...' : 'Responder'}
                </button>
              </form>
            </>
          )}
        </article>
      </section>
    </div>
  );
}
