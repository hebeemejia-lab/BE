import React from 'react';

export default function Quiz({ preguntas, onFinish }) {
  const [indice, setIndice] = React.useState(0);
  const [respuestas, setRespuestas] = React.useState([]);
  const [finalizado, setFinalizado] = React.useState(false);

  const handleRespuesta = (opcion) => {
    const nuevas = [...respuestas, opcion];
    setRespuestas(nuevas);
    if (indice < preguntas.length - 1) {
      setIndice(indice + 1);
    } else {
      setFinalizado(true);
      if (onFinish) onFinish(nuevas);
    }
  };

  if (finalizado) {
    const correctas = respuestas.filter((r, i) => r === preguntas[i].correcta).length;
    return (
      <div style={{textAlign:'center', marginTop: 32}}>
        <h3>¡Quiz finalizado!</h3>
        <p>Respuestas correctas: {correctas} de {preguntas.length}</p>
        {onFinish && <button onClick={() => onFinish(respuestas)} style={{marginTop:16, padding:'10px 24px', background:'#1a8cff', color:'#fff', border:'none', borderRadius:6}}>Continuar</button>}
      </div>
    );
  }

  const pregunta = preguntas[indice];
  return (
    <div style={{margin:'32px 0', padding:24, background:'#f0f6ff', borderRadius:12, boxShadow:'0 2px 8px #1a8cff22'}}>
      <h4 style={{color:'#1a8cff'}}>{pregunta.texto}</h4>
      <ul style={{listStyle:'none', padding:0}}>
        {pregunta.opciones.map((op, i) => (
          <li key={i} style={{margin:'12px 0'}}>
            <button onClick={() => handleRespuesta(i)} style={{padding:'10px 18px', fontSize:16, borderRadius:6, border:'1px solid #1a8cff', background:'#fff', color:'#1a8cff', cursor:'pointer', width:'100%', textAlign:'left'}}>{op}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
