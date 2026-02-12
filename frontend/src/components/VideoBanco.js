import React from 'react';

export default function VideoBanco({ src, title }) {
  return (
    <div style={{margin: '24px 0', textAlign: 'center'}}>
      <video controls style={{maxWidth: 480, borderRadius: 12, boxShadow: '0 2px 8px #1a8cff33'}}>
        <source src={src} type="video/mp4" />
        Tu navegador no soporta el video.
      </video>
      {title && <div style={{marginTop: 8, color: '#1a8cff', fontWeight: 500}}>{title}</div>}
    </div>
  );
}
