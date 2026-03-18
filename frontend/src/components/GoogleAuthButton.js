import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-service';
const INITIALIZED_CLIENT_ID_KEY = '__beGoogleInitializedClientId';

export default function GoogleAuthButton({ clientId, onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [error, setError] = useState('');

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

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

      const googleId = window.google.accounts.id;
      if (window[INITIALIZED_CLIENT_ID_KEY] !== clientId) {
        googleId.initialize({
          client_id: clientId,
          callback: (response) => {
            if (disabledRef.current || !response?.credential) {
              return;
            }
            onCredentialRef.current(response.credential);
          },
        });
        window[INITIALIZED_CLIENT_ID_KEY] = clientId;
      }

      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width: 320,
      });

      setError('');
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
  }, [clientId]);

  return (
    <div style={{ display: 'grid', gap: '8px', justifyItems: 'center', width: '100%' }}>
      <div ref={buttonRef} />
      {error ? <div className="error-message">{error}</div> : null}
    </div>
  );
}