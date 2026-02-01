// Definir relaciones entre modelos
const User = require('./User');
const Loan = require('./Loan');
const BankAccount = require('./BankAccount');
const CuotaPrestamo = require('./CuotaPrestamo');

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

module.exports = {
  User,
  Loan,
  BankAccount,
  CuotaPrestamo
};
