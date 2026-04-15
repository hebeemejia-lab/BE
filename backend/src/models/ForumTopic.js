const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ForumTopic = sequelize.define('ForumTopic', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titulo: {
    type: DataTypes.STRING(160),
    allowNull: false,
  },
  contenido: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  activo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'forum_topics',
  timestamps: true,
  indexes: [
    { fields: ['usuarioId'] },
    { fields: ['createdAt'] },
    { fields: ['activo'] },
  ],
});

module.exports = ForumTopic;
