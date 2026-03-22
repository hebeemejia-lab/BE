// Definir relaciones entre modelos
const { sequelize } = require('../config/database');
const User = require('./User');
const Loan = require('./Loan');
const BankAccount = require('./BankAccount');
const CuotaPrestamo = require('./CuotaPrestamo');
const Inversion = require('./Inversion');
const FundingTransfer = require('./FundingTransfer');
const Transaction = require('./Transaction');
const Budget = require('./Budget');
const ForumTopic = require('./ForumTopic');
const ForumReply = require('./ForumReply');

// Usuario tiene muchos préstamos
User.hasMany(Loan, {
  foreignKey: 'usuarioId',
  as: 'prestamos'
});

Loan.belongsTo(User, {
  foreignKey: 'usuarioId'
});

// Usuario tiene muchas cuentas bancarias
User.hasMany(BankAccount, {
  foreignKey: 'usuarioId',
  as: 'cuentasBancarias',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

BankAccount.belongsTo(User, {
  foreignKey: 'usuarioId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Préstamo tiene muchas cuotas
Loan.hasMany(CuotaPrestamo, {
  foreignKey: 'prestamoId',
  as: 'cuotasPrestamo'
});

CuotaPrestamo.belongsTo(Loan, {
  foreignKey: 'prestamoId'
});

// Usuario tiene muchas inversiones
User.hasMany(Inversion, {
  foreignKey: 'usuarioId',
  as: 'inversiones'
});

Inversion.belongsTo(User, {
  foreignKey: 'usuarioId'
});

// Usuario tiene muchas transferencias de fondeo (BE -> Alpaca)
User.hasMany(FundingTransfer, {
  foreignKey: 'usuarioId',
  as: 'fundingTransfers',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

FundingTransfer.belongsTo(User, {
  foreignKey: 'usuarioId',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Cuenta bancaria tiene muchas transferencias de fondeo
BankAccount.hasMany(FundingTransfer, {
  foreignKey: 'bankAccountId',
  as: 'fundingTransfers',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

FundingTransfer.belongsTo(BankAccount, {
  foreignKey: 'bankAccountId',
  onDelete: 'SET NULL',
  onUpdate: 'CASCADE'
});

// Usuario tiene muchas transacciones (gastos personales)
User.hasMany(Transaction, {
  foreignKey: 'userId',
  as: 'transactions'
});

Transaction.belongsTo(User, {
  foreignKey: 'userId'
});

// Usuario tiene muchos presupuestos
User.hasMany(Budget, {
  foreignKey: 'userId',
  as: 'budgets'
});

Budget.belongsTo(User, {
  foreignKey: 'userId'
});

// Foro: usuario crea temas
User.hasMany(ForumTopic, {
  foreignKey: 'usuarioId',
  as: 'temasForo',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ForumTopic.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'autorTema',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Foro: tema tiene respuestas
ForumTopic.hasMany(ForumReply, {
  foreignKey: 'temaId',
  as: 'respuestas',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ForumReply.belongsTo(ForumTopic, {
  foreignKey: 'temaId',
  as: 'tema',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

// Foro: usuario crea respuestas
User.hasMany(ForumReply, {
  foreignKey: 'usuarioId',
  as: 'respuestasForo',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

ForumReply.belongsTo(User, {
  foreignKey: 'usuarioId',
  as: 'autorRespuesta',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE'
});

module.exports = {
  sequelize,
  User,
  Loan,
  BankAccount,
  CuotaPrestamo,
  Inversion,
  FundingTransfer,
  Transaction,
  Budget,
  ForumTopic,
  ForumReply
};
