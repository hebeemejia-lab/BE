import React, { useState, useEffect } from 'react';
import { bankAccountAPI } from '../services/api';
import './VincularCuenta.css';

export default function VincularCuenta() {
  const [tab, setTab] = useState('vincular'); // vincular | listado
  const [formData, setFormData] = useState({
    nombreCuenta: '',
    numeroCuenta: '',
    banco: 'Banreservas',
    tipoCuenta: 'ahorros',
    ruteo: '', // Código bancario (Routing/SWIFT)
  });
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (tab === 'listado') {
      cargarCuentas();
    }
  }, [tab]);

  const cargarCuentas = async () => {
    try {
      const response = await bankAccountAPI.listarCuentas();
      setCuentas(response.data);
    } catch (err) {
      console.error('Error cargando cuentas', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };


  const handleVincular = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await bankAccountAPI.vincularCuenta(formData);
      setSuccess('✓ Cuenta vinculada. Esperando microdeposits...');
      setFormData({
        nombreCuenta: '',
        numeroCuenta: '',
        banco: 'Banco Barenvas',
        tipoCuenta: 'ahorros',
        ruteo: '',
      });
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error vinculando cuenta');
    } finally {
      setLoading(false);
    }
  };


  const handleDesvincular = async (cuentaId) => {
    if (window.confirm('¿Desvincular esta cuenta?')) {
      try {
        await bankAccountAPI.desvincularCuenta(cuentaId);
        setCuentas(cuentas.filter((c) => c.id !== cuentaId));
        setSuccess('✓ Cuenta desvinculada');
      } catch (err) {
        setError(err.response?.data?.mensaje || 'Error desvinculando');
      }
    }
  };

  return (
    <div className="vincular-container">
      <div className="vincular-card">
        <div className="card-header">
          <h2>Gestionar Cuentas Bancarias</h2>
          <p>Vincula tu cuenta bancaria para recargas directas</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'vincular' ? 'active' : ''}`}
            onClick={() => setTab('vincular')}
          >
            ➕ Vincular Cuenta
          </button>
          <button
            className={`tab-btn ${tab === 'listado' ? 'active' : ''}`}
            onClick={() => setTab('listado')}
          >
            📋 Mis Cuentas
          </button>
        </div>

        {/* Vincular */}
        {tab === 'vincular' && (
          <form onSubmit={handleVincular} className="form-section">
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
                  <option value="Banreservas">Banreservas (RD)</option>
                  <option value="Banco Popular">Banco Popular (RD)</option>
                  <option value="BHD León">BHD León (RD)</option>
                  <option value="Scotiabank">Scotiabank (RD)</option>
                  <option value="Banco Caribe">Banco Caribe (RD)</option>
                  <option value="Banco Santa Cruz">Banco Santa Cruz (RD)</option>
                  <option value="Banco López de Haro">Banco López de Haro (RD)</option>
                  <option value="Banco Barenvas">Banco Barenvas</option>
                  <option value="Banco Mercantil">Banco Mercantil</option>
                  <option value="Banco Provincial">Banco Provincial</option>
                  <option value="Banco de Venezuela">Banco de Venezuela</option>
                  <option value="BBVA">BBVA</option>
                  <option value="Chase">Chase (USA)</option>
                  <option value="Bank of America">Bank of America (USA)</option>
                  <option value="Wells Fargo">Wells Fargo (USA)</option>
                  <option value="Citibank">Citibank (USA)</option>
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
              <label>Código Bancario (Routing/SWIFT)</label>
              <input
                type="text"
                name="ruteo"
                value={formData.ruteo}
                onChange={handleChange}
                placeholder="Ej: 021000021 (US) o BXCADODX (RD)"
                required
              />
              <small>
                Para bancos de EE.UU. usa Routing Number (9 dígitos).<br/>
                Para bancos dominicanos/internacionales usa el código SWIFT.<br/>
                <b>Ejemplos:</b> Banreservas: BXCADODX, Popular: BPDODOSX, BHD León: BHDDDOMM
              </small>
            </div>

            <div className="info-box">
              <h4>⚠️ Seguridad</h4>
              <ul>
                <li>✓ Datos encriptados con AES-256</li>
                <li>✓ Verificación con microdeposits</li>
                <li>✓ Cuentas protegidas por Stripe</li>
              </ul>
            </div>

            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Procesando...' : 'Vincular Cuenta'}
            </button>
          </form>
        )}

        {/* Listado */}
        {tab === 'listado' && (
          <div className="form-section">
            <h3>Tus Cuentas Bancarias</h3>
            {cuentas.length === 0 ? (
              <p className="sin-cuentas">No tienes cuentas vinculadas</p>
            ) : (
              <div className="cuentas-lista">
                {cuentas.map((cuenta) => (
                  <div key={cuenta.id} className="cuenta-item">
                    <div className="cuenta-info">
                      <h4>{cuenta.nombreCuenta}</h4>
                      <p>{cuenta.banco}</p>
                      <p className="cuenta-numero">****{cuenta.numerosCuenta}</p>
                    </div>
                    <div className="cuenta-estado">
                      <span className={`badge badge-${cuenta.estado}`}>
                        {cuenta.estado}
                      </span>
                      {cuenta.esDefault && <span className="badge badge-default">Por defecto</span>}
                    </div>
                    <div className="cuenta-acciones">
                      {cuenta.estado === 'verificada' && !cuenta.esDefault && (
                        <button
                          className="btn-pequeño btn-default"
                          onClick={() => alert('Función establecer default por hacer')}
                        >
                          Establecer como Default
                        </button>
                      )}
                      <button
                        className="btn-pequeño btn-danger"
                        onClick={() => handleDesvincular(cuenta.id)}
                      >
                        Desvincular
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
