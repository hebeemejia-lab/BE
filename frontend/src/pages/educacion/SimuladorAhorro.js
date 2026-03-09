import React, { useState } from 'react';

const SimuladorAhorro = () => {
  const [monto, setMonto] = useState(0);
  const [meses, setMeses] = useState(12);
  const [tasa, setTasa] = useState(5);
  const [resultado, setResultado] = useState(null);

  const calcularAhorro = (e) => {
    e.preventDefault();
    const tasaMensual = tasa / 100 / 12;
    const ahorroFinal = monto * Math.pow(1 + tasaMensual, meses);
    setResultado(ahorroFinal.toFixed(2));
  };

  return (
    <div className="educacion-container">
      <h1>Simulador de Ahorro</h1>
      <form onSubmit={calcularAhorro}>
        <label>
          Monto inicial:
          <input type="number" value={monto} onChange={e => setMonto(Number(e.target.value))} min="0" required />
        </label>
        <br />
        <label>
          Plazo (meses):
          <input type="number" value={meses} onChange={e => setMeses(Number(e.target.value))} min="1" required />
        </label>
        <br />
        <label>
          Tasa de interés anual (%):
          <input type="number" value={tasa} onChange={e => setTasa(Number(e.target.value))} min="0" step="0.01" required />
        </label>
        <br />
        <button type="submit">Calcular</button>
      </form>
      {resultado && (
        <div className="resultado">
          <h3>Resultado:</h3>
          <p>Al final de {meses} meses tendrás <strong>${resultado}</strong></p>
        </div>
      )}
    </div>
  );
};

export default SimuladorAhorro;
