import React, { useState } from 'react';
import { cryptoAPI } from '../services/api';

function CryptoForm({ token, tipo = 'depositar' }) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('BTC');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      setMessage({ type: 'error', text: 'El monto debe ser mayor a 0' });
      return;
    }
    if (!currency) {
      setMessage({ type: 'error', text: 'Debes seleccionar una moneda' });
      return;
    }
    if (!address) {
      setMessage({ type: 'error', text: 'Debes ingresar una dirección' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      let result;
      if (tipo === 'depositar') {
        result = await cryptoAPI.depositar({
          amount: parseFloat(amount),
          currency,
          address
        });
      } else {
        result = await cryptoAPI.retirar(token, {
          amount: parseFloat(amount),
          currency,
          address
        });
      }
      setMessage({ type: 'success', text: `✅ ${tipo === 'depositar' ? 'Depósito' : 'Retiro'} enviado correctamente (dummy)` });
    } catch (error) {
      setMessage({ type: 'error', text: `❌ Error al procesar el ${tipo}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-6 mt-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">
        {tipo === 'depositar' ? 'Depósito Cripto' : 'Retiro Cripto'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Monto</label>
          <input
            type="number"
            step="0.0001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Moneda</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
            <option value="USDT">USDT</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Dirección</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {loading ? 'Procesando...' : tipo === 'depositar' ? 'Depositar' : 'Retirar'}
        </button>
      </form>
      {message && (
        <div
          className={`mt-4 p-2 rounded-md text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

export default CryptoForm;
