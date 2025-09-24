const EventAttendance = require('../models/EventAttendance');
const EventGroup = require('../models/EventGroup');
const EventPost = require('../models/EventPost');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Controlador de funcionalidades sociales para eventos
 * Maneja asistencia, grupos y publicaciones sociales
 */

// ==================== ASISTENCIA A EVENTOS ====================

/**
 * Marcar asistencia a un evento
 */
const markAttendance = async (req, res) => {
  try {
    const { eventId, status, attendingWith, notes } = req.body;
    const userId = req.user.id; // Asumiendo middleware de autenticación

    // Verificar si ya existe una asistencia
    let attendance = await EventAttendance.findOne({ user: userId, event: eventId });

    if (attendance) {
      // Actualizar asistencia existente
      attendance.status = status;
      attendance.attendingWith = attendingWith || [];
      attendance.notes = notes;
      await attendance.save();
    } else {
      // Crear nueva asistencia
      attendance = new EventAttendance({
        user: userId,
        event: eventId,
        status,
        attendingWith: attendingWith || [],
        notes
      });
      await attendance.save();
    }

    await attendance.populate('user', 'username');
    await attendance.populate('event', 'title date venue');

    logger.info('Attendance marked:', { userId, eventId, status });

    res.json({
      success: true,
      data: attendance,
      message: 'Asistencia registrada exitosamente'
    });
  } catch (error) {
    logger.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar asistencia'
    });
  }
};

/**
 * Obtener asistencia de un usuario
 */
const getUserAttendance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const query = { user: userId };
    if (status) query.status = status;

    const attendances = await EventAttendance.find(query)
      .populate('event', 'title date venue artist')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await EventAttendance.countDocuments(query);

    res.json({
      success: true,
      data: attendances,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error getting user attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener asistencias'
    });
  }
};

/**
 * Obtener estadísticas de asistencia para un evento
 */
const getEventAttendanceStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    const stats = await EventAttendance.getAttendanceStats(eventId);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error getting attendance stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
};

// ==================== GRUPOS PARA EVENTOS ====================

/**
 * Crear un grupo para un evento
 */
const createEventGroup = async (req, res) => {
  try {
    const { name, description, eventId, maxMembers, isPrivate, meetingPoint, transportation } = req.body;
    const creatorId = req.user.id;

    const group = new EventGroup({
      name,
      description,
      event: eventId,
      creator: creatorId,
      maxMembers: maxMembers || 20,
      isPrivate: isPrivate || false,
      meetingPoint,
      transportation
    });

    // Agregar creador como admin
    group.members.push({
      user: creatorId,
      role: 'admin'
    });

    await group.save();
    await group.populate('creator', 'username');
    await group.populate('event', 'title venue');

    logger.info('Event group created:', { groupId: group._id, creatorId, eventId });

    res.status(201).json({
      success: true,
      data: group,
      message: 'Grupo creado exitosamente'
    });
  } catch (error) {
    logger.error('Error creating event group:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear grupo'
    });
  }
};

/**
 * Unirse a un grupo
 */
const joinEventGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await EventGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    await group.addMember(userId);

    await group.populate('members.user', 'username');

    logger.info('User joined group:', { userId, groupId });

    res.json({
      success: true,
      data: group,
      message: 'Te has unido al grupo exitosamente'
    });
  } catch (error) {
    logger.error('Error joining group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al unirte al grupo'
    });
  }
};

/**
 * Salir de un grupo
 */
const leaveEventGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user.id;

    const group = await EventGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    await group.removeMember(userId);

    logger.info('User left group:', { userId, groupId });

    res.json({
      success: true,
      message: 'Has salido del grupo exitosamente'
    });
  } catch (error) {
    logger.error('Error leaving group:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al salir del grupo'
    });
  }
};

/**
 * Obtener grupos de un evento
 */
const getEventGroups = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?.id; // Opcional para usuarios no autenticados

    const groups = await EventGroup.getEventGroups(eventId, userId);

    res.json({
      success: true,
      data: groups
    });
  } catch (error) {
    logger.error('Error getting event groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener grupos'
    });
  }
};

/**
 * Enviar mensaje en chat de grupo
 */
const sendGroupMessage = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { message, type = 'text' } = req.body;
    const userId = req.user.id;

    const group = await EventGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Grupo no encontrado'
      });
    }

    await group.addMessage(userId, message, type);

    res.json({
      success: true,
      message: 'Mensaje enviado exitosamente'
    });
  } catch (error) {
    logger.error('Error sending group message:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al enviar mensaje'
    });
  }
};

// ==================== PUBLICACIONES SOCIALES ====================

/**
 * Crear una publicación para un evento
 */
const createEventPost = async (req, res) => {
  try {
    const { eventId, type, title, content, media, rating, tags, location } = req.body;
    const authorId = req.user.id;

    const post = new EventPost({
      event: eventId,
      author: authorId,
      type,
      title,
      content,
      media: media || [],
      rating,
      tags: tags || [],
      location
    });

    await post.save();
    await post.populate('author', 'username');
    await post.populate('event', 'title venue');

    logger.info('Event post created:', { postId: post._id, authorId, eventId, type });

    res.status(201).json({
      success: true,
      data: post,
      message: 'Publicación creada exitosamente'
    });
  } catch (error) {
    logger.error('Error creating event post:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear publicación'
    });
  }
};

/**
 * Obtener publicaciones de un evento
 */
const getEventPosts = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { type, page = 1, limit = 20 } = req.query;

    const options = {
      type,
      limit: parseInt(limit),
      skip: (page - 1) * parseInt(limit)
    };

    const posts = await EventPost.getEventPosts(eventId, options);
    const total = await EventPost.countDocuments({
      event: eventId,
      isPublished: true,
      ...(type && { type })
    });

    res.json({
      success: true,
      data: posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    logger.error('Error getting event posts:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener publicaciones'
    });
  }
};

/**
 * Agregar reacción a una publicación
 */
const addPostReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const { reactionType } = req.body;
    const userId = req.user.id;

    const post = await EventPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    await post.addReaction(userId, reactionType);

    res.json({
      success: true,
      message: 'Reacción agregada exitosamente'
    });
  } catch (error) {
    logger.error('Error adding post reaction:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar reacción'
    });
  }
};

/**
 * Agregar comentario a una publicación
 */
const addPostComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const post = await EventPost.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Publicación no encontrada'
      });
    }

    await post.addComment(userId, content);

    res.json({
      success: true,
      message: 'Comentario agregado exitosamente'
    });
  } catch (error) {
    logger.error('Error adding post comment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar comentario'
    });
  }
};

/**
 * Obtener estadísticas sociales de un evento
 */
const getEventSocialStats = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Obtener estadísticas de asistencia
    const attendanceStats = await EventAttendance.getAttendanceStats(eventId);

    // Obtener estadísticas de publicaciones
    const postStats = await EventPost.getEngagementStats(eventId);

    // Obtener número de grupos
    const groupCount = await EventGroup.countDocuments({ event: eventId });

    res.json({
      success: true,
      data: {
        attendance: attendanceStats,
        posts: postStats,
        groups: groupCount
      }
    });
  } catch (error) {
    logger.error('Error getting social stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas sociales'
    });
  }
};

module.exports = {
  // Attendance
  markAttendance,
  getUserAttendance,
  getEventAttendanceStats,

  // Groups
  createEventGroup,
  joinEventGroup,
  leaveEventGroup,
  getEventGroups,
  sendGroupMessage,

  // Posts
  createEventPost,
  getEventPosts,
  addPostReaction,
  addPostComment,
  getEventSocialStats
};