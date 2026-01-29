const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FAQFeedback = sequelize.define('FAQFeedback', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  faqId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'ID de la pregunta FAQ'
  },
  pregunta: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Pregunta del FAQ (para referencia)'
  },
  util: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
    comment: 'true=útil, false=no útil, null=sin voto'
  },
  comentario: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Comentario/sugerencia del usuario'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Email del usuario que envía feedback'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'faq_feedbacks',
  timestamps: false,
  indexes: [
    { fields: ['faqId'] },
    { fields: ['util'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = FAQFeedback;
