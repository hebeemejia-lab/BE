import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import './Perfil.css';

export default function Perfil() {
  const { usuario, updatePerfil } = useContext(AuthContext);
  const [form, setForm] = useState({
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    email: usuario?.email || '',
    moneda: usuario?.moneda || 'USD',
  });
  const [editando, setEditando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const exchangeRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    JPY: 149.50,
    MXN: 17.20,
    COP: 3950.00,
    ARS: 350.00,
    CLP: 950.00,
    PEN: 3.70,
    BRL: 4.95,
    DOP: 57.50,
  };

  const getCurrencySymbol = (currency) => {
    const symbols = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'JPY': '¥',
      'MXN': '$',
      'COP': '$',
      'ARS': '$',
      'CLP': '$',
      'PEN': 'S/',
      'BRL': 'R$',
      'DOP': 'RD$',
    };
    return symbols[currency] || '$';
  };

  const convertBalance = (amount, fromCurrency, toCurrency) => {
    if (!amount || !fromCurrency || !toCurrency) return 0;
    const amountInUSD = amount / (exchangeRates[fromCurrency] || 1);
    const convertedAmount = amountInUSD * (exchangeRates[toCurrency] || 1);
    return convertedAmount.toFixed(2);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      await updatePerfil(form);
      setMensaje('Datos actualizados correctamente');
      setEditando(false);
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error actualizando perfil');
    }
  };

  return (
    <div className="perfil-container">
      <h2>Mi Perfil</h2>
      {mensaje && <div className="success-message">{mensaje}</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div className="balance-display">
        <h3>Saldo Actual</h3>
        <p className="balance-amount">
          {getCurrencySymbol(form.moneda)}{convertBalance(usuario?.saldo, usuario?.moneda || 'USD', form.moneda)} {form.moneda}
        </p>
        {form.moneda !== (usuario?.moneda || 'USD') && (
          <p className="balance-note">
            (Original: {getCurrencySymbol(usuario?.moneda || 'USD')}{usuario?.saldo?.toFixed(2)} {usuario?.moneda || 'USD'})
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="perfil-form">
        <div className="form-group">
          <label>Nombre</label>
          <input name="nombre" value={form.nombre} onChange={handleChange} disabled={!editando} />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input name="apellido" value={form.apellido} onChange={handleChange} disabled={!editando} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input name="email" value={form.email} onChange={handleChange} disabled={!editando} />
        </div>
        <div className="form-group">
          <label>Moneda Preferida</label>
          <select name="moneda" value={form.moneda} onChange={handleChange} disabled={!editando}>
            <option value="USD">USD - Dólar Estadounidense</option>
            <option value="EUR">EUR - Euro</option>
            <option value="GBP">GBP - Libra Esterlina</option>
            <option value="JPY">JPY - Yen Japonés</option>
            <option value="MXN">MXN - Peso Mexicano</option>
            <option value="COP">COP - Peso Colombiano</option>
            <option value="ARS">ARS - Peso Argentino</option>
            <option value="CLP">CLP - Peso Chileno</option>
            <option value="PEN">PEN - Sol Peruano</option>
            <option value="BRL">BRL - Real Brasileño</option>
            <option value="DOP">DOP - Peso Dominicano</option>
          </select>
        </div>
        {editando ? (
          <button type="submit" className="btn-submit">Guardar</button>
        ) : (
          <button type="button" onClick={() => setEditando(true)} className="btn-submit">Editar</button>
        )}
      </form>
    </div>
  );
}
