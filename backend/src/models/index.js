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

module.exports = {
  sequelize,
  User,
  Loan,
  BankAccount,
  CuotaPrestamo,
  Inversion,
  FundingTransfer,
  Transaction,
  Budget
};
