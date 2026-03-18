import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-service';

export default function GoogleAuthButton({ clientId, onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!clientId || !buttonRef.current) {
      return undefined;
    }

    let cancelled = false;

    const renderGoogleButton = () => {
      if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
        return;
      }

      buttonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          if (disabled || !response?.credential) {
            return;
          }
          onCredential(response.credential);
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 320,
      });
    };

    const onScriptError = () => {
      if (!cancelled) {
        setError('No se pudo cargar Google Sign-In.');
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
      return () => {
        cancelled = true;
      };
    }

    let script = document.getElementById(SCRIPT_ID);
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = onScriptError;
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', renderGoogleButton);
    }

    return () => {
      cancelled = true;
      if (script) {
        script.removeEventListener('load', renderGoogleButton);
      }
    };
  }, [clientId, disabled, onCredential]);

  return (
    <div style={{ display: 'grid', gap: '8px', justifyItems: 'center', width: '100%' }}>
      <div ref={buttonRef} />
      {error ? <div className="error-message">{error}</div> : null}
    </div>
  );
}