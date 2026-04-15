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
        type: DataTypes.ENUM('paypal_payout', 'transferencia_manual', 'crypto_bybit'),
        defaultValue: 'paypal_payout',
      },
      estado: {
        type: DataTypes.ENUM('pendiente', 'aprobada', 'enviada', 'completada', 'rechazada', 'fallida', 'procesada'),
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
      proveedorRetiro: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      withdrawalIdExterno: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      txHash: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      monedaActiva: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      redRetiro: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      walletAddress: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      montoActivo: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: true,
      },
      precioReferenciaUsd: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: true,
      },
      feeActivo: {
        type: DataTypes.DECIMAL(24, 8),
        allowNull: true,
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
