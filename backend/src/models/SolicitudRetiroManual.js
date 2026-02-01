const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SolicitudRetiroManual = sequelize.define(
  'SolicitudRetiroManual',
  {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      monto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      moneda: {
        type: DataTypes.STRING(3),
        defaultValue: 'USD',
      },
      metodo: {
        type: DataTypes.ENUM('paypal_payout', 'transferencia_manual'),
        defaultValue: 'paypal_payout',
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'aprobada', 'rechazada', 'procesada'),
        defaultValue: 'pendiente',
      },
      // Información del usuario que solicita
      nombreUsuario: {
        type: DataTypes.STRING(255),
      },
      emailUsuario: {
        type: DataTypes.STRING(255),
      },
      cedulaUsuario: {
        type: DataTypes.STRING(50),
      },
      // Información bancaria
      banco: {
        type: DataTypes.STRING(100),
      },
      tipoCuenta: {
        type: DataTypes.STRING(50),
      },
      numeroCuenta: {
        type: DataTypes.STRING(50),
      },
      nombreBeneficiario: {
        type: DataTypes.STRING(255),
      },
      // Información de procesamiento
      batchIdPayPal: {
        type: DataTypes.STRING(255),
      },
      numeroReferencia: {
        type: DataTypes.STRING(255),
      },
      // Notas del admin
      notasAdmin: {
        type: DataTypes.TEXT,
      },
      // Auditoría
      procesadoPor: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Users',
          key: 'id',
        },
      },
      fechaProcesamiento: {
        type: DataTypes.DATE,
      },
      razonRechazo: {
        type: DataTypes.TEXT,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'solicitudes_retiro_manual',
      timestamps: true,
    }
  );

module.exports = SolicitudRetiroManual;
