import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import './ChatBotFAQ.css';

const ChatBotFAQ = ({ isOpen, onClose }) => {
  const [mensajes, setMensajes] = useState([
    {
      tipo: 'bot',
      texto: '👋 ¡Hola! Soy el asistente virtual de Banco Exclusivo. ¿En qué puedo ayudarte hoy?',
      timestamp: new Date()
    }
  ]);
  const [inputTexto, setInputTexto] = useState('');
  const [cargando, setCargando] = useState(false);
  const [preguntasPopulares, setPreguntasPopulares] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(true);
  const [feedbackActivo, setFeedbackActivo] = useState(null); // ID del FAQ para feedback
  const [comentarioFeedback, setComentarioFeedback] = useState('');
  const chatEndRef = useRef(null);

  // Cargar preguntas populares al abrir el chat
  useEffect(() => {
    if (isOpen) {
      cargarPreguntasPopulares();
    }
  }, [isOpen]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const cargarPreguntasPopulares = async () => {
    try {
      const response = await api.get('/faq/populares');
      if (response.data.exito) {
        setPreguntasPopulares(response.data.preguntas);
      }
    } catch (error) {
      console.error('Error cargando preguntas populares:', error);
    }
  };

  const enviarPregunta = async (preguntaTexto = null) => {
    const pregunta = preguntaTexto || inputTexto.trim();
    
    if (!pregunta) return;

    // Agregar mensaje del usuario
    const mensajeUsuario = {
      tipo: 'usuario',
      texto: pregunta,
      timestamp: new Date()
    };

    setMensajes(prev => [...prev, mensajeUsuario]);
    setInputTexto('');
    setMostrarSugerencias(false);
    setCargando(true);

    try {
      const response = await api.post('/faq/consultar', { pregunta });
      
      // Agregar respuesta del bot CON ID para feedback
      const mensajeBot = {
        tipo: 'bot',
        texto: response.data.respuesta,
        categoria: response.data.categoria,
        faqId: response.data.faqId || null,
        preguntaFAQ: response.data.preguntaRelacionada,
        timestamp: new Date()
      };

      setMensajes(prev => [...prev, mensajeBot]);
      setFeedbackActivo(mensajeBot.faqId);

    } catch (error) {
      console.error('Error consultando FAQ:', error);
      const mensajeError = {
        tipo: 'bot',
        texto: '❌ Lo siento, hubo un error. Por favor intenta de nuevo o contacta a soporte.',
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, mensajeError]);
    } finally {
      setCargando(false);
    }
  };

  const enviarFeedback = async (util) => {
    if (!feedbackActivo) return;

    try {
      await api.post('/faq-feedback/guardar', {
        faqId: feedbackActivo,
        pregunta: mensajes.find(m => m.faqId === feedbackActivo)?.preguntaFAQ,
        util,
        comentario: comentarioFeedback || null
      });

      // Mostrar confirmación
      const confirmar = {
        tipo: 'bot',
        texto: `✅ Gracias por tu feedback${comentarioFeedback ? ' y tu comentario' : ''}. Nos ayuda a mejorar.`,
        timestamp: new Date()
      };
      setMensajes(prev => [...prev, confirmar]);
      setFeedbackActivo(null);
      setComentarioFeedback('');

    } catch (error) {
      console.error('Error enviando feedback:', error);
    }
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    enviarPregunta();
  };

  const seleccionarPreguntaPopular = (pregunta) => {
    enviarPregunta(pregunta);
  };

  const limpiarChat = () => {
    setMensajes([
      {
        tipo: 'bot',
        texto: '👋 ¡Hola! Soy el asistente virtual de Banco Exclusivo. ¿En qué puedo ayudarte hoy?',
        timestamp: new Date()
      }
    ]);
    setMostrarSugerencias(true);
  };

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={onClose}>
      <div className="chatbot-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar">🤖</div>
            <div>
              <h3>Asistente Virtual</h3>
              <span className="chatbot-status">🟢 En línea</span>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button 
              className="chatbot-btn-icon" 
              onClick={limpiarChat}
              title="Limpiar chat"
            >
              🔄
            </button>
            <button 
              className="chatbot-btn-close" 
              onClick={onClose}
              title="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <div className="chatbot-mensajes">
          {mensajes.map((mensaje, index) => (
            <div 
              key={index} 
              className={`chatbot-mensaje ${mensaje.tipo === 'usuario' ? 'usuario' : 'bot'}`}
            >
              {mensaje.tipo === 'bot' && (
                <div className="mensaje-avatar">🤖</div>
              )}
              <div className="mensaje-contenido">
                <div className="mensaje-texto">
                  {mensaje.texto.split('\n').map((linea, i) => (
                    <React.Fragment key={i}>
                      {linea}
                      {i < mensaje.texto.split('\n').length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
                {mensaje.categoria && (
                  <span className="mensaje-categoria">
                    {mensaje.categoria}
                  </span>
                )}
                
                {/* Botones de feedback */}
                {mensaje.tipo === 'bot' && mensaje.faqId === feedbackActivo && (
                  <div className="feedback-container">
                    <p className="feedback-titulo">¿Te fue útil?</p>
                    <div className="feedback-botones">
                      <button 
                        className="feedback-btn util"
                        onClick={() => enviarFeedback(true)}
                        title="Sí, fue útil"
                      >
                        👍 Sí
                      </button>
                      <button 
                        className="feedback-btn no-util"
                        onClick={() => enviarFeedback(false)}
                        title="No fue útil"
                      >
                        👎 No
                      </button>
                    </div>
                    <textarea
                      className="feedback-comentario"
                      placeholder="(Opcional) Cuéntanos cómo podemos mejorar..."
                      value={comentarioFeedback}
                      onChange={(e) => setComentarioFeedback(e.target.value)}
                      rows="2"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {cargando && (
            <div className="chatbot-mensaje bot">
              <div className="mensaje-avatar">🤖</div>
              <div className="mensaje-contenido">
                <div className="mensaje-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          {/* Preguntas populares */}
          {mostrarSugerencias && preguntasPopulares.length > 0 && (
            <div className="chatbot-sugerencias">
              <p className="sugerencias-titulo">💡 Preguntas frecuentes:</p>
              {preguntasPopulares.map((pregunta) => (
                <button
                  key={pregunta.id}
                  className="sugerencia-btn"
                  onClick={() => seleccionarPreguntaPopular(pregunta.pregunta)}
                >
                  {pregunta.pregunta}
                </button>
              ))}
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <form className="chatbot-input-container" onSubmit={manejarEnvio}>
          <input
            type="text"
            className="chatbot-input"
            placeholder="Escribe tu pregunta..."
            value={inputTexto}
            onChange={(e) => setInputTexto(e.target.value)}
            disabled={cargando}
          />
          <button 
            type="submit" 
            className="chatbot-btn-enviar"
            disabled={!inputTexto.trim() || cargando}
          >
            ➤
          </button>
        </form>

        {/* Footer */}
        <div className="chatbot-footer">
          <span>🤖 Respuestas instantáneas • Sin esperas</span>
        </div>
      </div>
    </div>
  );
};

export default ChatBotFAQ;
