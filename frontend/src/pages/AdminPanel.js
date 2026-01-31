import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AdminPanel.css';

const AdminPanel = () => {
  const [vistaActual, setVistaActual] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [prestamos, setPrestamos] = useState([]);
  const [usuariosAdmin, setUsuariosAdmin] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [usuariosCargando, setUsuariosCargando] = useState(false);

  useEffect(() => {
    cargarDashboard();
  }, []);

  const cargarDashboard = async () => {
    try {
      setCargando(true);
      const response = await api.get('/admin/dashboard');
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error cargando dashboard:', error);
      alert('Error al cargar estadísticas');
    } finally {
      setCargando(false);
    }
  };

  const cargarPrestamos = async () => {
    try {
      setCargando(true);
      const [prestamosRes, usuariosRes] = await Promise.all([
        api.get('/admin/prestamos'),
        api.get('/admin/usuarios')
      ]);
      setPrestamos(prestamosRes.data.prestamos);
      setUsuariosAdmin(usuariosRes.data.usuarios || []);
      setVistaActual('prestamos');
    } catch (error) {
      console.error('Error cargando préstamos:', error);
      alert('Error al cargar préstamos');
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuarios = async () => {
    try {
      setUsuariosCargando(true);
      const response = await api.get('/admin/usuarios');
      setUsuariosAdmin(response.data.usuarios || []);
      setVistaActual('clientes');
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setUsuariosCargando(false);
    }
  };

  const crearUsuarioAdmin = async (data) => {
    try {
      setUsuariosCargando(true);
      const response = await api.post('/admin/usuarios', data);
      alert(response.data.mensaje || 'Usuario creado');
      await cargarUsuarios();
    } catch (error) {
      console.error('Error creando usuario:', error);
      alert('Error al crear usuario');
    } finally {
      setUsuariosCargando(false);
    }
  };

  const registrarPago = async (cuotaId, metodoPago, referencia, notas) => {
    try {
      const response = await api.post(`/admin/cuotas/${cuotaId}/pagar`, {
        metodoPago,
        referenciaPago: referencia,
        notas
      });

      alert(response.data.mensaje);
      cargarPrestamos(); // Recargar lista
    } catch (error) {
      console.error('Error registrando pago:', error);
      alert('Error al registrar pago');
    }
  };

  const crearPrestamoAdmin = async (data) => {
    try {
      setCargando(true);
      const response = await api.post('/admin/prestamos', data);
      alert(response.data.mensaje || 'Préstamo creado');
      await cargarPrestamos();
    } catch (error) {
      console.error('Error creando préstamo:', error);
      alert('Error al crear préstamo');
    } finally {
      setCargando(false);
    }
  };

  const imprimirPrestamoPDF = (prestamo) => {
    const ventana = window.open('', '_blank');
    const monto = parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0).toFixed(2);
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura Préstamo - #${prestamo.id}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #001a4d; margin: 0; }
          .info { margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { background: #f0f0f0; padding: 15px; margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Banco Exclusivo</h1>
          <p>Factura de Préstamo</p>
          <p><strong>#${prestamo.id}</strong></p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span><strong>Cliente:</strong></span>
            <span>${prestamo.User?.nombre || ''} ${prestamo.User?.apellido || ''}</span>
          </div>
          <div class="info-row">
            <span><strong>Correo:</strong></span>
            <span>${prestamo.User?.email || ''}</span>
          </div>
          <div class="info-row">
            <span><strong>Fecha:</strong></span>
            <span>${new Date(prestamo.createdAt).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span><strong>Plazo:</strong></span>
            <span>${prestamo.plazo} cuotas</span>
          </div>
          <div class="info-row">
            <span><strong>Tasa:</strong></span>
            <span>${prestamo.tasaInteres}%</span>
          </div>
        </div>
        
        <div class="total">
          Monto del Préstamo: $${monto}
        </div>
        
        <div class="footer">
          <p>Banco Exclusivo - www.bancoexclusivo.lat</p>
          <p>Documento generado electrónicamente</p>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const imprimirPrestamo88 = (prestamo) => {
    const ventana = window.open('', '_blank');
    const monto = parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado || 0).toFixed(2);
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura Préstamo - #${prestamo.id}</title>
        <style>
          @media print {
            @page { size: 88mm auto; margin: 0; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            width: 88mm; 
            margin: 0 auto; 
            padding: 5mm;
            font-size: 11px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="center bold">BANCO EXCLUSIVO</div>
        <div class="center">www.bancoexclusivo.lat</div>
        <div class="line"></div>
        <div class="center bold">FACTURA PRÉSTAMO</div>
        <div class="center">#${prestamo.id}</div>
        <div class="line"></div>
        <div class="row">
          <span>Cliente:</span>
          <span>${prestamo.User?.nombre || ''}</span>
        </div>
        <div class="row">
          <span>Plazo:</span>
          <span>${prestamo.plazo}</span>
        </div>
        <div class="row">
          <span>Tasa:</span>
          <span>${prestamo.tasaInteres}%</span>
        </div>
        <div class="line"></div>
        <div class="row total">
          <span>TOTAL:</span>
          <span>$${monto}</span>
        </div>
        <div class="line"></div>
        <div class="center" style="margin-top: 10px; font-size: 9px;">
          ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const imprimirRecibo = async (cuotaId, formato) => {
    try {
      const response = await api.get(`/admin/cuotas/${cuotaId}/recibo`);
      const recibo = response.data.recibo;

      if (formato === 'pdf') {
        imprimirReciboPDF(recibo);
      } else if (formato === 'factura88') {
        imprimirFactura88(recibo);
      }
    } catch (error) {
      console.error('Error generando recibo:', error);
      alert('Error al generar recibo');
    }
  };

  const imprimirReciboPDF = (recibo) => {
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo de Pago - ${recibo.numeroRecibo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #001a4d; margin: 0; }
          .info { margin: 20px 0; }
          .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .total { background: #f0f0f0; padding: 15px; margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏦 Banco Exclusivo</h1>
          <p>Recibo de Pago de Cuota</p>
          <p><strong>${recibo.numeroRecibo}</strong></p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span><strong>Fecha:</strong></span>
            <span>${new Date(recibo.fecha).toLocaleDateString()}</span>
          </div>
          <div class="info-row">
            <span><strong>Cliente:</strong></span>
            <span>${recibo.cliente.nombre}</span>
          </div>
          <div class="info-row">
            <span><strong>Correo:</strong></span>
            <span>${recibo.cliente.correo}</span>
          </div>
          <div class="info-row">
            <span><strong>Préstamo ID:</strong></span>
            <span>#${recibo.prestamo.id}</span>
          </div>
          <div class="info-row">
            <span><strong>Cuota Nº:</strong></span>
            <span>${recibo.cuota.numero}</span>
          </div>
          <div class="info-row">
            <span><strong>Método de Pago:</strong></span>
            <span>${recibo.cuota.metodoPago}</span>
          </div>
          ${recibo.cuota.referencia ? `
          <div class="info-row">
            <span><strong>Referencia:</strong></span>
            <span>${recibo.cuota.referencia}</span>
          </div>` : ''}
        </div>
        
        <div class="total">
          Total Pagado: $${parseFloat(recibo.cuota.monto).toFixed(2)}
        </div>
        
        <div class="footer">
          <p>Gracias por su pago</p>
          <p>Banco Exclusivo - www.bancoexclusivo.lat</p>
          <p>Este es un documento generado electrónicamente</p>
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  const imprimirFactura88 = (recibo) => {
    const ventana = window.open('', '_blank');
    ventana.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Factura - ${recibo.numeroRecibo}</title>
        <style>
          @media print {
            @page { size: 88mm auto; margin: 0; }
          }
          body { 
            font-family: 'Courier New', monospace; 
            width: 88mm; 
            margin: 0 auto; 
            padding: 5mm;
            font-size: 11px;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 5px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total { font-size: 14px; font-weight: bold; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="center bold">
          BANCO EXCLUSIVO
        </div>
        <div class="center">www.bancoexclusivo.lat</div>
        <div class="line"></div>
        
        <div class="center bold">RECIBO DE PAGO</div>
        <div class="center">${recibo.numeroRecibo}</div>
        <div class="line"></div>
        
        <div class="row">
          <span>Fecha:</span>
          <span>${new Date(recibo.fecha).toLocaleDateString()}</span>
        </div>
        <div class="row">
          <span>Cliente:</span>
          <span>${recibo.cliente.nombre}</span>
        </div>
        <div class="row">
          <span>Préstamo:</span>
          <span>#${recibo.prestamo.id}</span>
        </div>
        <div class="row">
          <span>Cuota Nº:</span>
          <span>${recibo.cuota.numero}</span>
        </div>
        <div class="line"></div>
        
        <div class="row">
          <span>Método:</span>
          <span>${recibo.cuota.metodoPago}</span>
        </div>
        ${recibo.cuota.referencia ? `
        <div class="row">
          <span>Referencia:</span>
          <span>${recibo.cuota.referencia}</span>
        </div>` : ''}
        <div class="line"></div>
        
        <div class="row total">
          <span>TOTAL:</span>
          <span>$${parseFloat(recibo.cuota.monto).toFixed(2)}</span>
        </div>
        <div class="line"></div>
        
        <div class="center" style="margin-top: 10px; font-size: 9px;">
          Gracias por su pago
        </div>
        <div class="center" style="font-size: 9px;">
          ${new Date().toLocaleString()}
        </div>
      </body>
      </html>
    `);
    ventana.document.close();
    ventana.print();
  };

  return (
    <div className="admin-panel">
      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="admin-logo">
          <h2>🏦 Admin Panel</h2>
        </div>
        <nav className="admin-nav">
          <button 
            className={vistaActual === 'dashboard' ? 'active' : ''}
            onClick={() => setVistaActual('dashboard')}
          >
            📊 Dashboard
          </button>
          <button 
            className={vistaActual === 'prestamos' ? 'active' : ''}
            onClick={cargarPrestamos}
          >
            💰 Gestión Préstamos
          </button>
          <button 
            className={vistaActual === 'clientes' ? 'active' : ''}
            onClick={cargarUsuarios}
          >
            👤 Clientes
          </button>
          <button 
            className={vistaActual === 'faq' ? 'active' : ''}
            onClick={() => setVistaActual('faq')}
          >
            💬 Feedback FAQ
          </button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="admin-content">
        {cargando && <div className="admin-loading">Cargando...</div>}

        {/* Dashboard */}
        {vistaActual === 'dashboard' && dashboard && (
          <DashboardView dashboard={dashboard} />
        )}

        {/* Préstamos */}
        {vistaActual === 'prestamos' && (
          <PrestamosView 
            prestamos={prestamos} 
            onRegistrarPago={registrarPago}
            onImprimirRecibo={imprimirRecibo}
            onCrearPrestamo={crearPrestamoAdmin}
            usuariosAdmin={usuariosAdmin}
            onImprimirPrestamo={(prestamo, formato) => {
              if (formato === 'pdf') {
                imprimirPrestamoPDF(prestamo);
              } else {
                imprimirPrestamo88(prestamo);
              }
            }}
          />
        )}

        {vistaActual === 'clientes' && (
          <ClientesView
            usuarios={usuariosAdmin}
            cargando={usuariosCargando}
            onCrearUsuario={crearUsuarioAdmin}
          />
        )}

        {/* FAQ Feedback */}
        {vistaActual === 'faq' && (
          <FAQFeedbackView />
        )}
      </div>
    </div>
  );
};

// Componente Dashboard
const DashboardView = ({ dashboard }) => (
  <div className="dashboard-view">
    <h1>📊 Dashboard</h1>
    
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon">👥</div>
        <div className="stat-info">
          <h3>{dashboard.usuarios.total}</h3>
          <p>Usuarios</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💰</div>
        <div className="stat-info">
          <h3>{dashboard.prestamos.total}</h3>
          <p>Préstamos</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💵</div>
        <div className="stat-info">
          <h3>{dashboard.prestamos.totalPrestado}</h3>
          <p>Total Prestado</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⏳</div>
        <div className="stat-info">
          <h3>{dashboard.cuotas.pendientes}</h3>
          <p>Cuotas Pendientes</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">✅</div>
        <div className="stat-info">
          <h3>{dashboard.cuotas.pagadas}</h3>
          <p>Cuotas Pagadas</p>
        </div>
      </div>

      <div className="stat-card">
        <div className="stat-icon">😊</div>
        <div className="stat-info">
          <h3>{dashboard.faq.satisfaccion}%</h3>
          <p>Satisfacción FAQ</p>
        </div>
      </div>
    </div>
  </div>
);

// Componente Clientes
const ClientesView = ({ usuarios, cargando, onCrearUsuario }) => {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    password: '',
    cedula: '',
    telefono: '',
    direccion: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCrearUsuario(form);
    setForm({
      nombre: '',
      apellido: '',
      email: '',
      password: '',
      cedula: '',
      telefono: '',
      direccion: ''
    });
  };

  return (
    <div className="clientes-view">
      <h1>👤 Clientes</h1>

      <div className="cliente-crear">
        <h3>Crear cliente</h3>
        <form className="cliente-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Apellido"
            value={form.apellido}
            onChange={(e) => setForm({ ...form, apellido: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Correo"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Cédula"
            value={form.cedula}
            onChange={(e) => setForm({ ...form, cedula: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Teléfono"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Dirección"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            required
          />
          <button type="submit" className="btn-crear">
            ➕ Crear cliente
          </button>
        </form>
      </div>

      {cargando ? (
        <div className="admin-loading">Cargando...</div>
      ) : (
        <div className="clientes-lista">
          {usuarios.length === 0 ? (
            <p>No hay clientes registrados</p>
          ) : (
            usuarios.map((u) => (
              <div key={u.id} className="cliente-item">
                <div>
                  <strong>{u.nombre} {u.apellido}</strong>
                  <div className="cliente-email">{u.email}</div>
                </div>
                <span className="cliente-id">#{u.id}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Componente Préstamos
const PrestamosView = ({ prestamos, onRegistrarPago, onImprimirRecibo, onCrearPrestamo, onImprimirPrestamo, usuariosAdmin }) => {
  const [prestamoExpandido, setPrestamoExpandido] = useState(null);
  const [nuevoPrestamo, setNuevoPrestamo] = useState({
    usuarioId: '',
    monto: '',
    plazo: '',
    tasaInteres: '5',
    fechaPrimerVencimiento: ''
  });
  const [creandoPrestamo, setCreandoPrestamo] = useState(false);

  const handleCrearPrestamo = async (e) => {
    e.preventDefault();
    setCreandoPrestamo(true);
    await onCrearPrestamo({
      usuarioId: nuevoPrestamo.usuarioId,
      monto: nuevoPrestamo.monto,
      plazo: nuevoPrestamo.plazo,
      tasaInteres: nuevoPrestamo.tasaInteres,
      fechaPrimerVencimiento: nuevoPrestamo.fechaPrimerVencimiento || null
    });
    setNuevoPrestamo({
      usuarioId: '',
      monto: '',
      plazo: '',
      tasaInteres: '5',
      fechaPrimerVencimiento: ''
    });
    setCreandoPrestamo(false);
  };

  return (
    <div className="prestamos-view">
      <h1>💰 Gestión de Préstamos</h1>

      <div className="prestamo-crear">
        <h3>Crear nuevo préstamo</h3>
        <form className="prestamo-form" onSubmit={handleCrearPrestamo}>
          <select
            value={nuevoPrestamo.usuarioId}
            onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, usuarioId: e.target.value })}
            required
          >
            <option value="">Selecciona usuario</option>
            {usuariosAdmin.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} {u.apellido} - {u.email}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            placeholder="Monto"
            value={nuevoPrestamo.monto}
            onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, monto: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Número de cuotas"
            value={nuevoPrestamo.plazo}
            onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, plazo: e.target.value })}
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Tasa (%)"
            value={nuevoPrestamo.tasaInteres}
            onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, tasaInteres: e.target.value })}
          />
          <input
            type="date"
            placeholder="Primer vencimiento"
            value={nuevoPrestamo.fechaPrimerVencimiento}
            onChange={(e) => setNuevoPrestamo({ ...nuevoPrestamo, fechaPrimerVencimiento: e.target.value })}
          />
          <button type="submit" className="btn-crear" disabled={creandoPrestamo}>
            {creandoPrestamo ? 'Creando...' : '➕ Crear préstamo'}
          </button>
        </form>
      </div>
      
      {prestamos.length === 0 ? (
        <p>No hay préstamos registrados</p>
      ) : (
        <div className="prestamos-lista">
          {prestamos.map(prestamo => (
            <PrestamoCard 
              key={prestamo.id}
              prestamo={prestamo}
              expandido={prestamoExpandido === prestamo.id}
              onToggle={() => setPrestamoExpandido(
                prestamoExpandido === prestamo.id ? null : prestamo.id
              )}
              onRegistrarPago={onRegistrarPago}
              onImprimirRecibo={onImprimirRecibo}
              onImprimirPrestamo={onImprimirPrestamo}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente Préstamo Card
const PrestamoCard = ({ prestamo, expandido, onToggle, onRegistrarPago, onImprimirRecibo, onImprimirPrestamo }) => {
  const [mostrarFormularioPago, setMostrarFormularioPago] = useState(null);
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [referencia, setReferencia] = useState('');
  const [notas, setNotas] = useState('');

  const handlePagar = (cuotaId) => {
    onRegistrarPago(cuotaId, metodoPago, referencia, notas);
    setMostrarFormularioPago(null);
    setMetodoPago('Efectivo');
    setReferencia('');
    setNotas('');
  };

  return (
    <div className="prestamo-card">
      <div className="prestamo-header" onClick={onToggle}>
        <div className="prestamo-info">
          <h3>
            {prestamo.User?.nombre} {prestamo.User?.apellido}
            <span className="prestamo-id">#{prestamo.id}</span>
          </h3>
          <p>{prestamo.User?.correo}</p>
        </div>
        <div className="prestamo-monto">
          <span className="monto">${parseFloat(prestamo.montoAprobado || prestamo.montoSolicitado).toFixed(2)}</span>
          <span className="estado">{prestamo.estado}</span>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="progreso-container">
        <div className="progreso-info">
          <span>{prestamo.cuotasPagadas} de {prestamo.totalCuotas} cuotas pagadas</span>
          <span>{prestamo.progreso}</span>
        </div>
        <div className="progreso-barra">
          <div 
            className="progreso-fill"
            style={{ width: prestamo.progreso }}
          ></div>
        </div>
      </div>

      {/* Detalles expandibles */}
      {expandido && (
        <div className="prestamo-detalles">
          <div className="prestamo-acciones">
            <button
              className="btn-imprimir btn-pdf"
              onClick={(e) => {
                e.stopPropagation();
                onImprimirPrestamo(prestamo, 'pdf');
              }}
            >
              📄 Factura PDF
            </button>
            <button
              className="btn-imprimir btn-factura88"
              onClick={(e) => {
                e.stopPropagation();
                onImprimirPrestamo(prestamo, 'factura88');
              }}
            >
              🧾 Factura 88mm
            </button>
          </div>
          <h4>Cuotas:</h4>
          <div className="cuotas-lista">
            {prestamo.cuotas.map(cuota => (
              <div key={cuota.id} className={`cuota-item ${cuota.pagado ? 'pagada' : 'pendiente'}`}>
                <div className="cuota-info">
                  <span className="cuota-numero">Cuota #{cuota.numero}</span>
                  <span className="cuota-monto">${parseFloat(cuota.monto).toFixed(2)}</span>
                  <span className="cuota-fecha">
                    {cuota.pagado 
                      ? `Pagada: ${new Date(cuota.fechaPago).toLocaleDateString()}`
                      : `Vence: ${new Date(cuota.fechaVencimiento).toLocaleDateString()}`
                    }
                  </span>
                </div>
                
                <div className="cuota-acciones">
                  {cuota.pagado ? (
                    <>
                      <button 
                        className="btn-imprimir btn-pdf"
                        onClick={() => onImprimirRecibo(cuota.id, 'pdf')}
                        title="Imprimir en PDF"
                      >
                        📄 PDF
                      </button>
                      <button 
                        className="btn-imprimir btn-factura88"
                        onClick={() => onImprimirRecibo(cuota.id, 'factura88')}
                        title="Imprimir factura 88mm"
                      >
                        🧾 Factura 88
                      </button>
                    </>
                  ) : (
                    <>
                      {mostrarFormularioPago === cuota.id ? (
                        <div className="formulario-pago">
                          <select 
                            value={metodoPago} 
                            onChange={(e) => setMetodoPago(e.target.value)}
                          >
                            <option>Efectivo</option>
                            <option>Transferencia</option>
                            <option>Tarjeta</option>
                            <option>Cheque</option>
                          </select>
                          <input 
                            type="text"
                            placeholder="Referencia (opcional)"
                            value={referencia}
                            onChange={(e) => setReferencia(e.target.value)}
                          />
                          <input 
                            type="text"
                            placeholder="Notas (opcional)"
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                          />
                          <button 
                            className="btn-confirmar"
                            onClick={() => handlePagar(cuota.id)}
                          >
                            ✓ Confirmar
                          </button>
                          <button 
                            className="btn-cancelar"
                            onClick={() => setMostrarFormularioPago(null)}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button 
                          className="btn-pagar"
                          onClick={() => setMostrarFormularioPago(cuota.id)}
                        >
                          💳 Registrar Pago
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente FAQ Feedback (placeholder)
const FAQFeedbackView = () => (
  <div className="faq-feedback-view">
    <h1>💬 Feedback del FAQ</h1>
    <p>Vista de estadísticas del FAQ (en construcción)</p>
  </div>
);

export default AdminPanel;
