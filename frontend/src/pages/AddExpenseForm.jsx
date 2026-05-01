import React, { useState } from 'react';

const EXPENSE_CATEGORIES = [
  { value: 'comida', label: '🍔 Comida', icon: '🍔' },
  { value: 'gasolina', label: '⛽ Gasolina', icon: '⛽' },
  { value: 'renta', label: '🏠 Renta', icon: '🏠' },
  { value: 'luz', label: '💡 Luz', icon: '💡' },
  { value: 'agua', label: '💧 Agua', icon: '💧' },
  { value: 'internet', label: '📡 Internet', icon: '📡' },
  { value: 'telefono', label: '📱 Teléfono', icon: '📱' },
  { value: 'transporte', label: '🚌 Transporte', icon: '🚌' },
  { value: 'salud', label: '🏥 Salud', icon: '🏥' },
  { value: 'educacion', label: '📚 Educación', icon: '📚' },
  { value: 'entretenimiento', label: '🎮 Entretenimiento', icon: '🎮' },
  { value: 'ropa', label: '👕 Ropa', icon: '👕' },
  { value: 'otros', label: '📦 Otros', icon: '📦' },
];

const INCOME_CATEGORIES = [
  { value: 'salario', label: '💰 Salario', icon: '💰' },
  { value: 'negocio', label: '💼 Negocio', icon: '💼' },
  { value: 'inversion', label: '📈 Inversión', icon: '📈' },
  { value: 'freelance', label: '💻 Freelance', icon: '💻' },
  { value: 'regalo', label: '🎁 Regalo', icon: '🎁' },
  { value: 'otros', label: '📦 Otros', icon: '📦' },
];

const AddExpenseForm = ({ onSubmit }) => {
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    setError('');
    if (!category || !amount || !date) {
      setError('Por favor completa todos los campos');
      return;
    }
    Promise.resolve(onSubmit({ type, category, amount: parseFloat(amount), date }))
      .then(() => {
        setCategory('');
        setAmount('');
        setDate('');
      })
      .catch(() => {
        setError('No se pudo registrar el gasto. Intenta de nuevo.');
      });
  };

  const categories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <div className="gastos-form-container">
      {error && <div style={{color: 'red', marginBottom: 12, textAlign: 'center'}}>{error}</div>}
      <form onSubmit={handleSubmit} className="gastos-form">
        <div className="form-group">
          <label>Tipo de transacción</label>
          <select value={type} onChange={e => { setType(e.target.value); setCategory(''); }}>
            <option value="expense">💸 Gasto</option>
            <option value="income">💵 Ingreso</option>
          </select>
        </div>

        <div className="form-group">
          <label>Categoría</label>
          <select value={category} onChange={e => setCategory(e.target.value)} required>
            <option value="">Selecciona una categoría</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Monto ($)</label>
          <input 
            type="number" 
            placeholder="0.00" 
            value={amount} 
            onChange={e => setAmount(e.target.value)} 
            step="0.01"
            min="0"
            required 
          />
        </div>

        <div className="form-group">
          <label>Fecha</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)} 
            max={new Date().toISOString().split('T')[0]}
            required 
          />
        </div>

        <button type="submit" className="btn-submit">
          ✅ Registrar {type === 'expense' ? 'Gasto' : 'Ingreso'}
        </button>
      </form>
    </div>
  );
};

export default AddExpenseForm;
