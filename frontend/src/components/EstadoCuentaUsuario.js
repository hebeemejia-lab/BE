import React, { useEffect, useState } from 'react';
import axios from 'axios';
import API from '../services/api';
import FiltrosEstadoCuenta from './FiltrosEstadoCuenta';
import { toPng } from 'html-to-image';

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
    toPng(cuentaRef.current)
      .then(dataUrl => {
        const link = document.createElement('a');
        link.download = `estado-cuenta-${usuario.nombre}-${usuario.apellido}.png`;
        link.href = dataUrl;
        link.click();
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
      <div ref={cuentaRef} style={{ background: 'linear-gradient(135deg,#f8fafc 0%,#e2e8f0 100%)', padding: 24, borderRadius: 16, boxShadow: '0 4px 16px #e2e8f0', marginTop: 8 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Depositos</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.depositos, 'depositos').map(r => <li key={r.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>+${r.monto} <span style={{ color: '#b21d2b' }}>({r.metodo})</span> <span style={{ color: '#64748b' }}>{r.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Retiros</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.retiros, 'retiros').map(r => <li key={r.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>-${r.monto} <span style={{ color: '#b21d2b' }}>{r.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Transferencias Bancarias</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.transferenciasBancarias, 'transferenciasBancarias').map(t => <li key={t.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>-${t.monto} <span style={{ color: '#b21d2b' }}>{t.banco}</span> <span style={{ color: '#64748b' }}>{t.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(t.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Transferencias Internacionales</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.transferenciasInternacionales, 'transferenciasInternacionales').map(t => <li key={t.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>-${t.monto} <span style={{ color: '#b21d2b' }}>{t.paisDestino}</span> <span style={{ color: '#64748b' }}>{t.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(t.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Préstamos</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.prestamos, 'prestamos').map(p => <li key={p.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>${p.montoSolicitado} <span style={{ color: '#64748b' }}>{p.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(p.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Inversiones</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.inversiones, 'inversiones').map(i => <li key={i.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>{i.symbol} {i.cantidad} <span style={{ color: '#64748b' }}>{i.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(i.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
          <div>
            <h4 style={{ color: '#0f1b3d', marginBottom: 8 }}>Transferencias entre usuarios</h4>
            <ul style={{ listStyle: 'none', padding: 0 }}>{filtrar(estadoCuenta.transferencias, 'transferencias').map(t => <li key={t.id} style={{ background: '#fff', borderRadius: 8, marginBottom: 6, padding: 8, boxShadow: '0 1px 4px #eee' }}>${t.monto} <span style={{ color: '#b21d2b' }}>{t.concepto}</span> <span style={{ color: '#64748b' }}>{t.estado}</span> <span style={{ float: 'right', color: '#94a3b8' }}>{new Date(t.createdAt).toLocaleString()}</span></li>)}</ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EstadoCuentaUsuario;
