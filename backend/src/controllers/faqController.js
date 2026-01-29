// Controlador del Bot FAQ - Sin APIs, respuestas instantáneas
const { 
  buscarRespuesta, 
  obtenerPorCategoria, 
  obtenerCategorias, 
  obtenerPopulares,
  faqData 
} = require('../data/faqData');

// Procesar pregunta del usuario
exports.consultarFAQ = async (req, res) => {
  try {
    const { pregunta } = req.body;

    if (!pregunta || pregunta.trim() === '') {
      return res.status(400).json({
        exito: false,
        mensaje: 'Por favor escribe una pregunta'
      });
    }

    // Buscar respuesta
    const resultado = buscarRespuesta(pregunta);

    if (resultado) {
      return res.json({
        exito: true,
        respuesta: resultado.respuesta,
        preguntaRelacionada: resultado.pregunta,
        categoria: resultado.categoria,
        faqId: resultado.id
      });
    }

    // Si no encuentra respuesta
    return res.json({
      exito: true,
      respuesta: `🤔 No encontré una respuesta exacta para eso. 

Puedes intentar:
• Reformular tu pregunta
• Ver las preguntas frecuentes más populares
• Contactar a soporte: ${process.env.ADMIN_EMAIL || 'soporte@bancoexclusivo.lat'}

**Temas disponibles:**
📱 Recargas | 💸 Transferencias | 🏦 Retiros | 💰 Préstamos | 🔒 Seguridad | 👤 Cuenta`,
      sinCoincidencia: true
    });

  } catch (error) {
    console.error('❌ Error en FAQ:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al procesar tu pregunta',
      error: error.message
    });
  }
};

// Obtener preguntas por categoría
exports.obtenerCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    
    const preguntas = obtenerPorCategoria(categoria);

    if (preguntas.length === 0) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Categoría no encontrada'
      });
    }

    res.json({
      exito: true,
      categoria,
      cantidad: preguntas.length,
      preguntas
    });

  } catch (error) {
    console.error('❌ Error obteniendo categoría:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener preguntas',
      error: error.message
    });
  }
};

// Listar todas las categorías disponibles
exports.listarCategorias = async (req, res) => {
  try {
    const categorias = obtenerCategorias();

    res.json({
      exito: true,
      total: categorias.length,
      categorias
    });

  } catch (error) {
    console.error('❌ Error listando categorías:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar categorías',
      error: error.message
    });
  }
};

// Obtener preguntas más frecuentes
exports.preguntasPopulares = async (req, res) => {
  try {
    const populares = obtenerPopulares();

    res.json({
      exito: true,
      cantidad: populares.length,
      preguntas: populares.map(faq => ({
        id: faq.id,
        pregunta: faq.pregunta,
        categoria: faq.categoria
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo populares:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener preguntas populares',
      error: error.message
    });
  }
};

// Obtener todas las FAQs (para búsqueda en frontend)
exports.obtenerTodas = async (req, res) => {
  try {
    res.json({
      exito: true,
      total: faqData.length,
      faqs: faqData.map(faq => ({
        id: faq.id,
        pregunta: faq.pregunta,
        categoria: faq.categoria
      }))
    });

  } catch (error) {
    console.error('❌ Error obteniendo todas las FAQs:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener FAQs',
      error: error.message
    });
  }
};
