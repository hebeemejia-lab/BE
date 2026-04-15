const { ForumTopic, ForumReply, User } = require('../models');

const toPublicUser = (user) => ({
  id: user.id,
  nombre: user.nombre,
  apellido: user.apellido,
  email: user.email,
});

const mapTopicSummary = (topic) => ({
  id: topic.id,
  titulo: topic.titulo,
  contenido: topic.contenido,
  createdAt: topic.createdAt,
  updatedAt: topic.updatedAt,
  respuestasCount: Array.isArray(topic.respuestas) ? topic.respuestas.length : 0,
  autor: topic.autorTema ? toPublicUser(topic.autorTema) : null,
});

exports.listarTemas = async (req, res) => {
  try {
    const temas = await ForumTopic.findAll({
      where: { activo: true },
      include: [
        {
          model: User,
          as: 'autorTema',
          attributes: ['id', 'nombre', 'apellido', 'email'],
        },
        {
          model: ForumReply,
          as: 'respuestas',
          attributes: ['id'],
          where: { activo: true },
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({
      exito: true,
      total: temas.length,
      temas: temas.map(mapTopicSummary),
    });
  } catch (error) {
    console.error('❌ Error listando temas del foro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al listar temas del foro',
      error: error.message,
    });
  }
};

exports.crearTema = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { titulo, contenido } = req.body;

    const tituloLimpio = String(titulo || '').trim();
    const contenidoLimpio = String(contenido || '').trim();

    if (!tituloLimpio || !contenidoLimpio) {
      return res.status(400).json({
        exito: false,
        mensaje: 'Título y contenido son obligatorios',
      });
    }

    if (tituloLimpio.length > 160) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El título no puede superar 160 caracteres',
      });
    }

    const tema = await ForumTopic.create({
      usuarioId,
      titulo: tituloLimpio,
      contenido: contenidoLimpio,
      activo: true,
    });

    const temaCompleto = await ForumTopic.findByPk(tema.id, {
      include: [
        {
          model: User,
          as: 'autorTema',
          attributes: ['id', 'nombre', 'apellido', 'email'],
        },
      ],
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Tema creado correctamente',
      tema: {
        id: temaCompleto.id,
        titulo: temaCompleto.titulo,
        contenido: temaCompleto.contenido,
        createdAt: temaCompleto.createdAt,
        updatedAt: temaCompleto.updatedAt,
        respuestasCount: 0,
        autor: temaCompleto.autorTema ? toPublicUser(temaCompleto.autorTema) : null,
      },
    });
  } catch (error) {
    console.error('❌ Error creando tema del foro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear tema del foro',
      error: error.message,
    });
  }
};

exports.obtenerTema = async (req, res) => {
  try {
    const { temaId } = req.params;

    const tema = await ForumTopic.findOne({
      where: { id: temaId, activo: true },
      include: [
        {
          model: User,
          as: 'autorTema',
          attributes: ['id', 'nombre', 'apellido', 'email'],
        },
        {
          model: ForumReply,
          as: 'respuestas',
          where: { activo: true },
          required: false,
          include: [
            {
              model: User,
              as: 'autorRespuesta',
              attributes: ['id', 'nombre', 'apellido', 'email'],
            },
          ],
          order: [['createdAt', 'ASC']],
        },
      ],
      order: [[{ model: ForumReply, as: 'respuestas' }, 'createdAt', 'ASC']],
    });

    if (!tema) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Tema no encontrado',
      });
    }

    res.json({
      exito: true,
      tema: {
        id: tema.id,
        titulo: tema.titulo,
        contenido: tema.contenido,
        createdAt: tema.createdAt,
        updatedAt: tema.updatedAt,
        autor: tema.autorTema ? toPublicUser(tema.autorTema) : null,
        respuestas: (tema.respuestas || []).map((respuesta) => ({
          id: respuesta.id,
          contenido: respuesta.contenido,
          createdAt: respuesta.createdAt,
          updatedAt: respuesta.updatedAt,
          autor: respuesta.autorRespuesta ? toPublicUser(respuesta.autorRespuesta) : null,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Error obteniendo tema del foro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al obtener tema del foro',
      error: error.message,
    });
  }
};

exports.crearRespuesta = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { temaId } = req.params;
    const { contenido } = req.body;

    const contenidoLimpio = String(contenido || '').trim();
    if (!contenidoLimpio) {
      return res.status(400).json({
        exito: false,
        mensaje: 'El contenido de la respuesta es obligatorio',
      });
    }

    const tema = await ForumTopic.findOne({ where: { id: temaId, activo: true } });
    if (!tema) {
      return res.status(404).json({
        exito: false,
        mensaje: 'Tema no encontrado',
      });
    }

    const respuesta = await ForumReply.create({
      temaId: tema.id,
      usuarioId,
      contenido: contenidoLimpio,
      activo: true,
    });

    const respuestaCompleta = await ForumReply.findByPk(respuesta.id, {
      include: [
        {
          model: User,
          as: 'autorRespuesta',
          attributes: ['id', 'nombre', 'apellido', 'email'],
        },
      ],
    });

    res.status(201).json({
      exito: true,
      mensaje: 'Respuesta publicada correctamente',
      respuesta: {
        id: respuestaCompleta.id,
        contenido: respuestaCompleta.contenido,
        createdAt: respuestaCompleta.createdAt,
        updatedAt: respuestaCompleta.updatedAt,
        autor: respuestaCompleta.autorRespuesta
          ? toPublicUser(respuestaCompleta.autorRespuesta)
          : null,
      },
    });
  } catch (error) {
    console.error('❌ Error creando respuesta del foro:', error);
    res.status(500).json({
      exito: false,
      mensaje: 'Error al crear respuesta del foro',
      error: error.message,
    });
  }
};
