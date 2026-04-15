const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FundingTransfer = sequelize.define('FundingTransfer', {
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
    bankAccountId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'BankAccounts',
        key: 'id',
      },
    },
    recargaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alpacaAccountId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    alpacaTransferId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    alpacaRelationshipId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    transferType: {
      type: DataTypes.ENUM('ach', 'wire'),
      allowNull: false,
      defaultValue: 'ach',
    },
    direction: {
      type: DataTypes.ENUM('INCOMING', 'OUTGOING'),
      allowNull: false,
      defaultValue: 'INCOMING',
    },
    timing: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'immediate',
    },
    amount: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'USD',
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'requested',
    },
    provider: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'alpaca_broker',
    },
    providerStatus: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    numeroReferencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    requestPayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    responsePayload: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    creditedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'FundingTransfers',
    timestamps: true,
    indexes: [
      {
        fields: ['usuarioId'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['alpacaTransferId'],
      },
    ],
  });
  return FundingTransfer;
};