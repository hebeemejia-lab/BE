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

// Usuario tiene una cuenta bancaria
User.hasOne(BankAccount, {
  foreignKey: 'usuarioId',
  as: 'cuentaBancaria'
});

BankAccount.belongsTo(User, {
  foreignKey: 'usuarioId'
});

// Préstamo tiene muchas cuotas
Loan.hasMany(CuotaPrestamo, {
  foreignKey: 'prestamoId',
  as: 'cuotas'
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
