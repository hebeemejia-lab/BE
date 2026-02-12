import React from 'react';

export default function AnimacionBanco() {
  return (
    <div style={{margin: '32px 0', textAlign: 'center'}}>
      <svg width="220" height="120" viewBox="0 0 220 120">
        <g>
          <rect x="10" y="60" width="40" height="40" rx="8" fill="#1a8cff">
            <animate attributeName="y" values="60;30;60" dur="1.2s" repeatCount="indefinite" />
          </rect>
          <rect x="60" y="60" width="40" height="40" rx="8" fill="#2d3e50">
            <animate attributeName="y" values="60;20;60" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
          </rect>
          <rect x="110" y="60" width="40" height="40" rx="8" fill="#1a8cff">
            <animate attributeName="y" values="60;10;60" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
          </rect>
          <rect x="160" y="60" width="40" height="40" rx="8" fill="#2d3e50">
            <animate attributeName="y" values="60;20;60" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
          </rect>
        </g>
      </svg>
      <div style={{marginTop: 8, color: '#1a8cff', fontWeight: 500}}>Banco Exclusivo en movimiento</div>
    </div>
  );
}
