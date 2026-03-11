import React from 'react';

export default function SalaDeSaldos({
  saldoPrestamos = 0,
  saldoPaypal = 0,
  saldoInversion = 0,
  depositoPrestamo = 0,
  onTuGrupoClick = () => {},
}) {
  return (
    <div className="sala-saldos-container" style={{ maxWidth: 500, margin: '40px auto', padding: 24, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Sala de Saldos</h2>
      <div className="saldos-list" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div className="saldo-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Saldo de préstamos negativos</span>
          <span style={{ fontWeight: 600, color: '#b21d2b' }}>-${saldoPrestamos.toFixed(2)}</span>
        </div>
        <div className="saldo-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Saldo de PayPal</span>
          <span style={{ fontWeight: 600, color: '#1976d2' }}>${saldoPaypal.toFixed(2)}</span>
        </div>
        <div className="saldo-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Saldo de inversión</span>
          <span style={{ fontWeight: 600, color: '#388e3c' }}>${saldoInversion.toFixed(2)}</span>
        </div>
        <div className="saldo-item" style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
          <span>Depósito + préstamo</span>
          <span style={{ fontWeight: 600, color: '#ff9800' }}>${depositoPrestamo.toFixed(2)}</span>
        </div>
      </div>
      <button
        className="btn-tu-grupo"
        style={{ marginTop: 32, width: '100%', padding: '12px 0', borderRadius: 8, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
        onClick={onTuGrupoClick}
      >
        Tu Grupo
      </button>
    </div>
  );
}
