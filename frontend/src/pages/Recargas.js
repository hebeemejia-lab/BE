export default function Recargas() {
  const { usuario, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [monto, setMonto] = useState('');
  const [loadingRecarga, setLoadingRecarga] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (!usuario && !loading) {
      navigate('/login');
    }
  }, [usuario, loading, navigate]);

  const handleMontoChange = (e) => {
    setMonto(e.target.value);
  };

  const handleRecargaStripeCheckout = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!monto || parseFloat(monto) <= 0) {
      setError('Ingresa un monto válido');
      return;
    }
    setLoadingRecarga(true);
    try {
      const response = await recargaAPI.crearRecargaStripe({ monto: parseFloat(monto) });
      if (response.data && response.data.url) {
        window.location.href = response.data.url; // Redirect to Stripe Checkout
      } else {
        setError('No se pudo obtener la URL de pago.');
      }
    } catch (err) {
      setError(err.response?.data?.mensaje || 'Error creando sesión de pago');
    } finally {
      setLoadingRecarga(false);
    }
  };

  return (
    <div className="recargas-container">
      <div className="recargas-card">
        <div className="card-header">
          <h2>Recargar Saldo</h2>
          <p>Agrega dinero a tu cuenta</p>
        </div>
        <div className="saldo-actual">
          <span>Saldo disponible:</span>
          <h3>${parseFloat(usuario?.saldo || 0).toFixed(2)}</h3>
        </div>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleRecargaStripeCheckout} className="form-section">
          <div className="form-group">
            <label>Monto a recargar ($)</label>
            <div className="monto-selector">
              {[10, 20, 50, 100, 200, 500].map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`monto-btn ${monto === m.toString() ? 'selected' : ''}`}
                  onClick={() => setMonto(m.toString())}
                >
                  ${m}
                </button>
              ))}
            </div>
            <input
              type="number"
              name="monto"
              value={monto}
              onChange={handleMontoChange}
              placeholder="Otro monto"
              step="0.01"
              min="1"
              className="custom-monto"
            />
          </div>
          <div className="info-box">
            <h4>🔒 Información Segura</h4>
            <ul>
              <li>✓ Procesamiento seguro con Stripe, PayPal y Google Pay</li>
              <li>✓ Datos encriptados con SSL/TLS</li>
              <li>✓ Cumplimiento PCI DSS</li>
            </ul>
          </div>
          <button
            type="submit"
            disabled={loadingRecarga || !monto}
            className="btn-submit"
          >
            {loadingRecarga ? 'Redirigiendo...' : `Recargar $${parseFloat(monto || 0).toFixed(2)} con Stripe, PayPal o Google Pay`}
          </button>
        </form>
      </div>
    </div>
  );
}
