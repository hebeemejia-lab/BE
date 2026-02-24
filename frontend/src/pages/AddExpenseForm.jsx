import React, { useState } from 'react';

const AddExpenseForm = ({ onSubmit }) => {
  const [type, setType] = useState('expense');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    onSubmit({ type, category, amount: parseFloat(amount), date });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Registrar Ingreso/Gasto</h3>
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="income">Ingreso</option>
        <option value="expense">Gasto</option>
      </select>
      <input type="text" placeholder="Categoría" value={category} onChange={e => setCategory(e.target.value)} required />
      <input type="number" placeholder="Monto" value={amount} onChange={e => setAmount(e.target.value)} required />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <button type="submit">Registrar</button>
    </form>
  );
};

export default AddExpenseForm;
