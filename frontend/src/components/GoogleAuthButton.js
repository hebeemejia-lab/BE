import React, { useEffect, useRef, useState } from 'react';

const SCRIPT_ID = 'google-identity-service';
const INITIALIZED_CLIENT_ID_KEY = '__beGoogleInitializedClientId';
const GOOGLE_SCRIPT_RETRY_DELAYS = [0, 1500, 4000];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function GoogleAuthButton({ clientId, onCredential, disabled = false }) {
  const buttonRef = useRef(null);
  const onCredentialRef = useRef(onCredential);
  const disabledRef = useRef(disabled);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

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
        setError('No se pudo cargar Google Sign-In. Revisa tu conexión o bloqueo de red hacia Google.');
      }
    };

    const removeScript = () => {
      const staleScript = document.getElementById(SCRIPT_ID);
      if (staleScript) {
        staleScript.remove();
      }
    };

    const ensureGoogleScript = async () => {
      for (const delayMs of GOOGLE_SCRIPT_RETRY_DELAYS) {
        if (cancelled) {
          return;
        }

        if (delayMs > 0) {
          await wait(delayMs);
        }

        if (window.google?.accounts?.id) {
          renderGoogleButton();
          return;
        }

        removeScript();

        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.id = SCRIPT_ID;
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
          });

          renderGoogleButton();
          return;
        } catch (scriptError) {
          onScriptError();
        }
      }
    };

    const handleOnline = () => {
      setRetryKey((current) => current + 1);
    };

    ensureGoogleScript();
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', handleOnline);
    };
  }, [clientId, retryKey]);

  return (
    <div style={{ display: 'grid', gap: '8px', justifyItems: 'center', width: '100%' }}>
      <div ref={buttonRef} />
      {error ? <div className="error-message">{error}</div> : null}
    </div>
  );
}