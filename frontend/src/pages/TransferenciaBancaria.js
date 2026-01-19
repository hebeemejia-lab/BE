import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { transferAPI } from '../services/api';
import './TransferenciaBancaria.css';

export default function TransferenciaBancaria() {
  const { usuario } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    monto: '',
    nombreCuenta: '',
    numeroCuenta: '',
    banco: 'Banco Barenvas',
    tipoCuenta: 'ahorros',
    concepto: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [historial, setHistorial] = useState([]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await transferAPI.transferenciaBancaria(formData);
      setSuccess(`✓ Transferencia exitosa. Código: ${response.data.transferencia.codigoReferencia}`);
      setHistorial([response.data.transferencia, ...historial]);
      setFormData({
        monto: '',
        nombreCuenta: '',
        numeroCuenta: '',
        banco: 'Banco Barenvas',
        tipoCuenta: 'ahorros',
        concepto: '',
      });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error en la transferencia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="transferencia-bancaria-container">
      <div className="transferencia-card">
        <div className="card-header">
          <h2>Transferencia Bancaria</h2>
          <p>Transfiere dinero a cualquier cuenta bancaria</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Monto ($)</label>
              <input
                type="number"
                name="monto"
                value={formData.monto}
                onChange={handleChange}
                placeholder="100.00"
                step="0.01"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Saldo disponible</label>
              <input
                type="text"
                value={`$${parseFloat(usuario?.saldo || 0).toFixed(2)}`}
                disabled
                className="input-disabled"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Nombre del Titular</label>
              <input
                type="text"
                name="nombreCuenta"
                value={formData.nombreCuenta}
                onChange={handleChange}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label>Número de Cuenta</label>
              <input
                type="text"
                name="numeroCuenta"
                value={formData.numeroCuenta}
                onChange={handleChange}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Banco</label>
              <select
                name="banco"
                value={formData.banco}
                onChange={handleChange}
                required
              >
                <option value="Banco Barenvas">Banco Barenvas</option>
                <option value="Banco Mercantil">Banco Mercantil</option>
                <option value="Banco Provincial">Banco Provincial</option>
                <option value="Banco de Venezuela">Banco de Venezuela</option>
                <option value="BBVA">BBVA</option>
                <option value="Banco Santander">Banco Santander</option>
                <option value="Banco Actinver">Banco Actinver</option>
                <option value="Banco Azteca">Banco Azteca</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de Cuenta</label>
              <select
                name="tipoCuenta"
                value={formData.tipoCuenta}
                onChange={handleChange}
                required
              >
                <option value="ahorros">Ahorros</option>
                <option value="corriente">Corriente</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Concepto</label>
            <input
              type="text"
              name="concepto"
              value={formData.concepto}
              onChange={handleChange}
              placeholder="Pago de servicios"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-submit"
          >
            {loading ? 'Procesando...' : 'Transferir Dinero'}
          </button>
        </form>

        <div className="info-box">
          <h4>⚠️ Información importante</h4>
          <ul>
            <li>Las transferencias se procesan en 1-2 horas hábiles</li>
            <li>Verifica correctamente los datos de la cuenta destino</li>
            <li>Las transferencias son irreversibles</li>
            <li>Se aplican comisiones según el banco destino</li>
          </ul>
        </div>
      </div>

      {historial.length > 0 && (
        <div className="historial-card">
          <h3>Últimas Transferencias</h3>
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Banco</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Referencia</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((transfer) => (
                  <tr key={transfer.id}>
                    <td>{transfer.banco}</td>
                    <td>${parseFloat(transfer.monto).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge-${transfer.estado}`}>
                        {transfer.estado}
                      </span>
                    </td>
                    <td>{transfer.codigoReferencia}</td>
                    <td>{new Date(transfer.fecha).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
