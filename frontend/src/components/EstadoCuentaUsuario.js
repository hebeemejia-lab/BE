import React, { useEffect, useState } from 'react';
import API from '../services/api';
import FiltrosEstadoCuenta from './FiltrosEstadoCuenta';

const EstadoCuentaUsuario = ({ usuario }) => {
  const [estadoCuenta, setEstadoCuenta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', fechaDesde: '', fechaHasta: '', estado: '', montoMin: '', montoMax: '', metodo: '' });
  const cuentaRef = React.useRef(); // Declarar hook fuera de condicional

  useEffect(() => {
    setLoading(true);
    API.get(`/admin/usuarios/${usuario.id}/estado-cuenta`)
      .then(res => {
        setEstadoCuenta(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [usuario]);

  if (loading) return <div>Cargando estado de cuenta...</div>;
  if (!estadoCuenta || !estadoCuenta.exito) return <div>Error cargando estado de cuenta.</div>;

  // Filtrar transacciones
  const filtrar = (arr, tipo) => arr.filter(t => {
    if (filtros.tipo && filtros.tipo !== tipo) return false;
    if (filtros.estado && t.estado !== filtros.estado) return false;
    if (filtros.metodo && t.metodo !== filtros.metodo) return false;
    if (filtros.fechaDesde && new Date(t.createdAt) < new Date(filtros.fechaDesde)) return false;
    if (filtros.fechaHasta && new Date(t.createdAt) > new Date(filtros.fechaHasta)) return false;
    if (filtros.montoMin && Number(t.monto) < Number(filtros.montoMin)) return false;
    if (filtros.montoMax && Number(t.monto) > Number(filtros.montoMax)) return false;
    return true;
  });

  const handleImprimir = () => {
    const printContents = cuentaRef.current.innerHTML;
    const win = window.open('', '', 'height=700,width=900');
    win.document.write('<html><head><title>Estado de cuenta</title></head><body>' + printContents + '</body></html>');
    win.document.close();
    win.print();
  };

  const handleDescargarPNG = () => {
    if (!cuentaRef.current) return;
    import('html-to-image').then(HtmlToImage => {
      HtmlToImage.toPng(cuentaRef.current)
        .then(dataUrl => {
          const link = document.createElement('a');
          link.download = `estado-cuenta-${usuario.nombre}-${usuario.apellido}.png`;
          link.href = dataUrl;
          link.click();
        });
    });
  };

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <img src="/imagen/Diseño%20sin%20título%20(1)%20(1).png" alt="Banco Exclusivo Logo" style={{ width: 60, height: 60, borderRadius: '50%', boxShadow: '0 2px 8px #eee' }} />
        <h2 style={{ color: '#0f1b3d', fontWeight: 700, fontSize: 28, margin: 0 }}>Estado de cuenta</h2>
      </div>
      <div style={{ color: '#64748b', fontSize: 16, marginTop: 8, marginBottom: 8 }}>
        {usuario.nombre} {usuario.apellido} <span style={{ color: '#b21d2b', fontWeight: 500 }}>({usuario.email})</span>
      </div>
      <FiltrosEstadoCuenta filtros={filtros} setFiltros={setFiltros} />
      <div style={{ marginBottom: 16 }}>
        <button onClick={handleImprimir} style={{ background: '#0f1b3d', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>🖨️ Imprimir</button>
        <button onClick={handleDescargarPNG} style={{ marginLeft: 8, background: '#b21d2b', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 600, cursor: 'pointer' }}>🖼️ Descargar PNG</button>
      </div>
      <div ref={cuentaRef} style={{ background: '#fff', padding: 32, borderRadius: 18, boxShadow: '0 4px 24px #e2e8f0', marginTop: 8, border: '1.5px solid #e2e8f0', fontFamily: 'Segoe UI, Arial, sans-serif', color: '#222', minWidth: 320 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 24, fontSize: 15 }}>
          <thead>
            <tr style={{ background: '#f8fafc', color: '#0f1b3d' }}>
              <th style={{ padding: 10, border: '1px solid #e2e8f0' }}>Fecha</th>
              <th style={{ padding: 10, border: '1px solid #e2e8f0' }}>Tipo</th>
              <th style={{ padding: 10, border: '1px solid #e2e8f0' }}>Monto</th>
              <th style={{ padding: 10, border: '1px solid #e2e8f0' }}>Método/Detalle</th>
              <th style={{ padding: 10, border: '1px solid #e2e8f0' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              ...filtrar(estadoCuenta.depositos, 'depositos').map(r => ({
                fecha: new Date(r.createdAt).toLocaleString(),
                tipo: 'Depósito',
                monto: `+$${r.monto}`,
                detalle: r.metodo,
                estado: r.estado
              })),
              ...filtrar(estadoCuenta.retiros, 'retiros').map(r => ({
                fecha: new Date(r.createdAt).toLocaleString(),
                tipo: 'Retiro',
                monto: `-$${r.monto}`,
                detalle: r.metodo || '',
                estado: r.estado
              })),
              ...filtrar(estadoCuenta.transferenciasBancarias, 'transferenciasBancarias').map(t => ({
                fecha: new Date(t.createdAt).toLocaleString(),
                tipo: 'Transf. Bancaria',
                monto: `-$${t.monto}`,
                detalle: t.banco,
                estado: t.estado
              })),
              ...filtrar(estadoCuenta.transferenciasInternacionales, 'transferenciasInternacionales').map(t => ({
                fecha: new Date(t.createdAt).toLocaleString(),
                tipo: 'Transf. Internacional',
                monto: `-$${t.monto}`,
                detalle: t.paisDestino,
                estado: t.estado
              })),
              ...filtrar(estadoCuenta.prestamos, 'prestamos').map(p => ({
                fecha: new Date(p.createdAt).toLocaleString(),
                tipo: 'Préstamo',
                monto: `$${p.montoSolicitado}`,
                detalle: '',
                estado: p.estado
              })),
              ...filtrar(estadoCuenta.inversiones, 'inversiones').map(i => ({
                fecha: new Date(i.createdAt).toLocaleString(),
                tipo: 'Inversión',
                monto: i.cantidad,
                detalle: i.symbol,
                estado: i.estado
              })),
              ...filtrar(estadoCuenta.transferencias, 'transferencias').map(t => ({
                fecha: new Date(t.createdAt).toLocaleString(),
                tipo: 'Transf. Usuario',
                monto: `$${t.monto}`,
                detalle: t.concepto,
                estado: t.estado
              })),
            ].map((row, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#f8fafc' : '#fff' }}>
                <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{row.fecha}</td>
                <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{row.tipo}</td>
                <td style={{ padding: 8, border: '1px solid #e2e8f0', fontWeight: 600 }}>{row.monto}</td>
                <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{row.detalle}</td>
                <td style={{ padding: 8, border: '1px solid #e2e8f0' }}>{row.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 16, color: '#64748b', fontSize: 13, textAlign: 'right' }}>
          Generado: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default EstadoCuentaUsuario;
