// frontend/src/services/retiroService.js
// Ejemplos de cómo usar los nuevos endpoints de retiro

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// ============ ENDPOINTS PARA USUARIOS ============

/**
 * Procesar retiro con PayPal Payout automático
 * @param {number} monto - Monto a retirar
 * @param {string} moneda - USD, DOP, EUR
 * @param {number} cuentaId - ID de cuenta bancaria registrada
 * @returns {Promise<object>} - Respuesta con batchId de PayPal
 */
export const procesarRetiroPayPalPayout = async (monto, moneda, cuentaId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/retiros/procesar`,
      {
        monto,
        moneda,
        cuentaId,
        metodoRetiro: 'paypal_payout', // ← Retiro automático con PayPal
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      mensaje: response.data.mensaje,
      batchId: response.data.retiro.batchIdPayPal,
      numeroReferencia: response.data.retiro.numeroReferencia,
      estado: response.data.retiro.estado, // 'exitosa' o 'procesando'
      montoRetirado: response.data.montoRetirado,
      nuevoSaldo: response.data.nuevoSaldo,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.mensaje || error.message,
    };
  }
};

/**
 * Solicitar retiro manual (requiere aprobación del admin)
 * @param {number} monto - Monto a retirar
 * @param {string} moneda - USD, DOP, EUR
 * @param {number} cuentaId - ID de cuenta bancaria registrada
 * @returns {Promise<object>} - Respuesta con solicitudId
 */
export const solicitarRetiroManual = async (monto, moneda, cuentaId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/retiros/procesar`,
      {
        monto,
        moneda,
        cuentaId,
        metodoRetiro: 'transferencia_manual', // ← Requiere aprobación
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      mensaje: response.data.mensaje,
      solicitudId: response.data.solicitudId,
      numeroReferencia: response.data.numeroReferencia,
      estado: response.data.estado, // 'pendiente_aprobacion'
      montoSolicitado: response.data.monto,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.mensaje || error.message,
    };
  }
};

/**
 * Obtener historial de retiros del usuario
 * @returns {Promise<array>} - Lista de retiros
 */
export const obtenerHistorialRetiros = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/retiros/historial`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    return [];
  }
};

// ============ ENDPOINTS PARA ADMIN ============

/**
 * Obtener todas las solicitudes de retiro manual pendientes
 * @param {string} estado - 'pendiente', 'aprobada', 'rechazada', 'procesada'
 * @returns {Promise<array>} - Lista de solicitudes
 */
export const obtenerSolicitudesRetiroAdmin = async (estado = 'pendiente') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/admin/solicitudes-retiro?estado=${estado}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return response.data.solicitudes;
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    return [];
  }
};

/**
 * Obtener estado detallado de una solicitud
 * @param {number} solicitudId - ID de la solicitud
 * @returns {Promise<object>} - Detalles de la solicitud y estado en PayPal
 */
export const obtenerEstadoSolicitudAdmin = async (solicitudId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/admin/solicitudes-retiro/${solicitudId}/estado`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      solicitud: response.data.solicitud,
      estadoPayPal: response.data.estadoPayPal,
    };
  } catch (error) {
    console.error('Error obteniendo estado:', error);
    return null;
  }
};

/**
 * Aprobar solicitud de retiro y procesar PayPal Payout
 * @param {number} solicitudId - ID de la solicitud
 * @param {string} notasAdmin - Notas administrativas (opcional)
 * @returns {Promise<object>} - Respuesta de aprobación
 */
export const aprobarSolicitudRetiroAdmin = async (solicitudId, notasAdmin = '') => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/admin/solicitudes-retiro/${solicitudId}/aprobar`,
      { notasAdmin },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      mensaje: response.data.mensaje,
      solicitud: response.data.solicitud,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.mensaje || error.message,
    };
  }
};

/**
 * Rechazar solicitud de retiro y devolver dinero al usuario
 * @param {number} solicitudId - ID de la solicitud
 * @param {string} razonRechazo - Razón del rechazo (requerido)
 * @returns {Promise<object>} - Respuesta de rechazo
 */
export const rechazarSolicitudRetiroAdmin = async (solicitudId, razonRechazo) => {
  if (!razonRechazo || razonRechazo.trim().length === 0) {
    return {
      success: false,
      error: 'Debe proporcionar una razón para rechazar la solicitud',
    };
  }

  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/admin/solicitudes-retiro/${solicitudId}/rechazar`,
      { razonRechazo },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    return {
      success: true,
      mensaje: response.data.mensaje,
      solicitud: response.data.solicitud,
      dineroDevuelto: response.data.solicitud.montoDevuelto,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.mensaje || error.message,
    };
  }
};

// ============ COMPONENTES DE EJEMPLO ============

/**
 * Componente: Formulario de Retiro para Usuario
 * Permite elegir entre PayPal Payout automático o solicitud manual
 */
export const FormularioRetiro = () => {
  const [monto, setMonto] = React.useState('');
  const [moneda, setMoneda] = React.useState('USD');
  const [cuentaId, setCuentaId] = React.useState('');
  const [metodo, setMetodo] = React.useState('paypal_payout');
  const [cargando, setCargando] = React.useState(false);
  const [resultado, setResultado] = React.useState(null);

  const handleRetiro = async () => {
    setCargando(true);
    let res;

    if (metodo === 'paypal_payout') {
      res = await procesarRetiroPayPalPayout(monto, moneda, cuentaId);
      if (res.success) {
        setResultado({
          tipo: 'éxito',
          titulo: 'Retiro Procesado',
          mensaje: `${res.montoRetirado} ${moneda} transferido a PayPal`,
          detalles: `Referencia: ${res.numeroReferencia}`,
        });
      }
    } else {
      res = await solicitarRetiroManual(monto, moneda, cuentaId);
      if (res.success) {
        setResultado({
          tipo: 'éxito',
          titulo: 'Solicitud Creada',
          mensaje: `Solicitud de ${res.montoSolicitado} ${moneda} pendiente de aprobación`,
          detalles: `El administrador revisará tu solicitud. Referencia: ${res.numeroReferencia}`,
        });
      }
    }

    if (!res.success) {
      setResultado({
        tipo: 'error',
        titulo: 'Error en Retiro',
        mensaje: res.error,
      });
    }

    setCargando(false);
  };

  return (
    <div className="formulario-retiro">
      <h2>Solicitar Retiro</h2>

      {/* Seleccionar Método */}
      <div className="metodos">
        <label>
          <input
            type="radio"
            value="paypal_payout"
            checked={metodo === 'paypal_payout'}
            onChange={(e) => setMetodo(e.target.value)}
          />
          PayPal Retiro Instantáneo
          <small>Dinero llega en minutos a tu cuenta PayPal</small>
        </label>

        <label>
          <input
            type="radio"
            value="transferencia_manual"
            checked={metodo === 'transferencia_manual'}
            onChange={(e) => setMetodo(e.target.value)}
          />
          Solicitud de Retiro Manual
          <small>Requiere aprobación del administrador</small>
        </label>
      </div>

      {/* Formulario */}
      <div className="campos">
        <input
          type="number"
          placeholder="Monto a retirar"
          value={monto}
          onChange={(e) => setMonto(e.target.value)}
          min="1"
        />

        <select value={moneda} onChange={(e) => setMoneda(e.target.value)}>
          <option value="USD">USD</option>
          <option value="DOP">DOP</option>
          <option value="EUR">EUR</option>
        </select>

        <select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
          <option value="">Selecciona cuenta bancaria</option>
          {/* Aquí irían las cuentas del usuario */}
        </select>
      </div>

      <button onClick={handleRetiro} disabled={cargando}>
        {cargando ? 'Procesando...' : 'Solicitar Retiro'}
      </button>

      {resultado && (
        <div className={`resultado ${resultado.tipo}`}>
          <h3>{resultado.titulo}</h3>
          <p>{resultado.mensaje}</p>
          <small>{resultado.detalles}</small>
        </div>
      )}
    </div>
  );
};

/**
 * Componente: Panel de Admin para Gestionar Solicitudes
 */
export const PanelAdminRetiros = () => {
  const [solicitudes, setSolicitudes] = React.useState([]);
  const [filtro, setFiltro] = React.useState('pendiente');
  const [cargando, setCargando] = React.useState(false);

  React.useEffect(() => {
    cargarSolicitudes();
  }, [filtro]);

  const cargarSolicitudes = async () => {
    setCargando(true);
    const datos = await obtenerSolicitudesRetiroAdmin(filtro);
    setSolicitudes(datos);
    setCargando(false);
  };

  const handleAprobar = async (solicitudId) => {
    if (!window.confirm('¿Aprobar esta solicitud de retiro?')) return;

    const res = await aprobarSolicitudRetiroAdmin(solicitudId);
    if (res.success) {
      alert('Solicitud aprobada. PayPal Payout procesado.');
      cargarSolicitudes();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleRechazar = async (solicitudId) => {
    const razon = prompt('¿Razón del rechazo?');
    if (!razon) return;

    const res = await rechazarSolicitudRetiroAdmin(solicitudId, razon);
    if (res.success) {
      alert('Solicitud rechazada. Dinero devuelto al usuario.');
      cargarSolicitudes();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  return (
    <div className="panel-admin-retiros">
      <h2>Gestionar Retiros</h2>

      <div className="filtros">
        <button onClick={() => setFiltro('pendiente')} className={filtro === 'pendiente' ? 'activo' : ''}>
          Pendientes ({solicitudes.filter(s => s.estado === 'pendiente').length})
        </button>
        <button onClick={() => setFiltro('aprobada')} className={filtro === 'aprobada' ? 'activo' : ''}>
          Aprobadas
        </button>
        <button onClick={() => setFiltro('rechazada')} className={filtro === 'rechazada' ? 'activo' : ''}>
          Rechazadas
        </button>
        <button onClick={() => setFiltro('procesada')} className={filtro === 'procesada' ? 'activo' : ''}>
          Procesadas
        </button>
      </div>

      {cargando ? (
        <p>Cargando...</p>
      ) : (
        <table className="tabla-solicitudes">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Monto</th>
              <th>Banco</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((sol) => (
              <tr key={sol.id}>
                <td>{sol.nombreUsuario}</td>
                <td>${sol.monto}</td>
                <td>{sol.banco}</td>
                <td className={`estado-${sol.estado}`}>{sol.estado}</td>
                <td>{new Date(sol.createdAt).toLocaleDateString()}</td>
                <td className="acciones">
                  {sol.estado === 'pendiente' && (
                    <>
                      <button onClick={() => handleAprobar(sol.id)} className="btn-aprobar">
                        ✓ Aprobar
                      </button>
                      <button onClick={() => handleRechazar(sol.id)} className="btn-rechazar">
                        ✗ Rechazar
                      </button>
                    </>
                  )}
                  {(sol.estado === 'aprobada' || sol.estado === 'procesada') && (
                    <span className="badge-success">✓ Procesada</span>
                  )}
                  {sol.estado === 'rechazada' && (
                    <span className="badge-danger">✗ Rechazada</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default {
  procesarRetiroPayPalPayout,
  solicitarRetiroManual,
  obtenerHistorialRetiros,
  obtenerSolicitudesRetiroAdmin,
  obtenerEstadoSolicitudAdmin,
  aprobarSolicitudRetiroAdmin,
  rechazarSolicitudRetiroAdmin,
};
