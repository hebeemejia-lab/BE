import React, { useState } from 'react';

const currencyList = [
  { code: 'USD', name: 'Dólar estadounidense', rate: 1 },
  { code: 'EUR', name: 'Euro', rate: 0.92 },
  { code: 'MXN', name: 'Peso mexicano', rate: 17.2 },
  { code: 'COP', name: 'Peso colombiano', rate: 58.5 },
  { code: 'BRL', name: 'Real brasileño', rate: 5.1 },
  { code: 'ARS', name: 'Peso argentino', rate: 850 },
  { code: 'VES', name: 'Bolívar venezolano', rate: 36 },
  { code: 'CLP', name: 'Peso chileno', rate: 950 },
  { code: 'PEN', name: 'Sol peruano', rate: 3.7 },
  { code: 'GTQ', name: 'Quetzal guatemalteco', rate: 7.8 },
  { code: 'CRC', name: 'Colón costarricense', rate: 520 },
  { code: 'DOP', name: 'Peso dominicano', rate: 58 },
];

function getRate(from, to) {
  const fromRate = currencyList.find(c => c.code === from)?.rate || 1;
  const toRate = currencyList.find(c => c.code === to)?.rate || 1;
  return toRate / fromRate;
}

export default function CurrencyCalculator() {
  const [from, setFrom] = useState('DOP');
  const [to, setTo] = useState('USD');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);

  const handleConvert = (e) => {
    e.preventDefault();
    const baseRate = getRate(from, to);
    const baseValue = parseFloat(amount) * baseRate;
    const withFee = baseValue * 0.98; // 2% de ganancia
    setResult({
      base: baseValue,
      withFee,
      fee: baseValue * 0.02,
    });
  };

  return (
    <div style={{maxWidth: 420, margin: '40px auto', background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #001a4d22', padding: 24}}>
      <h2 style={{marginBottom: 16}}>💱 Calculadora de Divisas</h2>
      <form onSubmit={handleConvert} style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        <label>
          Monto:
          <input type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} required style={{marginLeft: 8, padding: 6, borderRadius: 6, border: '1px solid #ccc'}} />
        </label>
        <label>
          De:
          <select value={from} onChange={e => setFrom(e.target.value)} style={{marginLeft: 8, padding: 6, borderRadius: 6}}>
            {currencyList.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
          </select>
        </label>
        <label>
          A:
          <select value={to} onChange={e => setTo(e.target.value)} style={{marginLeft: 8, padding: 6, borderRadius: 6}}>
            {currencyList.map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
          </select>
        </label>
        <button type="submit" style={{background: '#003d99', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 'bold', cursor: 'pointer'}}>Convertir</button>
      </form>
      {result && (
        <div style={{marginTop: 24, background: '#f6f8fa', borderRadius: 8, padding: 16, textAlign: 'center'}}>
          <div style={{fontSize: 18, marginBottom: 8}}>
            Resultado: <b>{parseFloat(result.withFee).toFixed(2)} {to}</b>
          </div>
          <div style={{fontSize: 14, color: '#888'}}>Tasa real: {parseFloat(result.base).toFixed(2)} {to}</div>
          <div style={{fontSize: 14, color: '#cc0000'}}>Tu ganancia (2%): {parseFloat(result.fee).toFixed(2)} {to}</div>
        </div>
      )}
      <div style={{marginTop: 16, fontSize: 13, color: '#666'}}>
        Las tasas son referenciales y pueden variar. El cálculo incluye una comisión del 2% sobre el valor convertido.
      </div>
    </div>
  );
}
