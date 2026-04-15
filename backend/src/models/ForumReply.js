const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ForumReply = sequelize.define('ForumReply', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    temaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
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
    tableName: 'forum_replies',
    timestamps: true,
    indexes: [
      { fields: ['temaId'] },
      { fields: ['usuarioId'] },
      { fields: ['createdAt'] },
      { fields: ['activo'] },
    ],
  });
  return ForumReply;
};
