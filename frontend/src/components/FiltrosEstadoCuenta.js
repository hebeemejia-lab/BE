import React from 'react';

const FiltrosEstadoCuenta = ({ filtros, setFiltros }) => {
  return (
    <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <select value={filtros.tipo} onChange={e => setFiltros(f => ({ ...f, tipo: e.target.value }))}>
        <option value="">Todos los tipos</option>
        <option value="recargas">Recargas</option>
        <option value="retiros">Retiros</option>
        <option value="transferenciasBancarias">Transferencias Bancarias</option>
        <option value="transferenciasInternacionales">Transferencias Internacionales</option>
        <option value="prestamos">Préstamos</option>
        <option value="inversiones">Inversiones</option>
        <option value="transferencias">Transferencias entre usuarios</option>
      </select>
      <input type="date" value={filtros.fechaDesde} onChange={e => setFiltros(f => ({ ...f, fechaDesde: e.target.value }))} />
      <input type="date" value={filtros.fechaHasta} onChange={e => setFiltros(f => ({ ...f, fechaHasta: e.target.value }))} />
      <select value={filtros.estado} onChange={e => setFiltros(f => ({ ...f, estado: e.target.value }))}>
        <option value="">Todos los estados</option>
        <option value="exitosa">Exitosa</option>
        <option value="pendiente">Pendiente</option>
        <option value="rechazada">Rechazada</option>
        <option value="fallida">Fallida</option>
        <option value="procesando">Procesando</option>
        <option value="aprobada">Aprobada</option>
        <option value="completado">Completado</option>
        <option value="abierta">Abierta</option>
        <option value="cerrada">Cerrada</option>
      </select>
      <input type="number" placeholder="Monto mínimo" value={filtros.montoMin} onChange={e => setFiltros(f => ({ ...f, montoMin: e.target.value }))} style={{ width: 120 }} />
      <input type="number" placeholder="Monto máximo" value={filtros.montoMax} onChange={e => setFiltros(f => ({ ...f, montoMax: e.target.value }))} style={{ width: 120 }} />
      <select value={filtros.metodo} onChange={e => setFiltros(f => ({ ...f, metodo: e.target.value }))}>
        <option value="">Todos los métodos</option>
        <option value="tarjeta">Tarjeta</option>
        <option value="transferencia">Transferencia</option>
        <option value="paypal">PayPal</option>
        <option value="rapyd">Rapyd</option>
        <option value="codigo">Código</option>
        <option value="2checkout">2Checkout</option>
      </select>
    </div>
  );
};

export default FiltrosEstadoCuenta;
