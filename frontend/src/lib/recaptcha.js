const SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

let loadPromise = null;

function loadScript() {
  if (!SITE_KEY) return Promise.resolve(false);
  if (window.grecaptcha) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return loadPromise;
}

/**
 * Restituisce un token reCAPTCHA v3 per l'azione indicata, o null se reCAPTCHA
 * non è configurato (REACT_APP_RECAPTCHA_SITE_KEY assente) o non riesce a caricarsi.
 * In quel caso il backend applica comunque la propria logica di fallback.
 */
export async function getRecaptchaToken(action) {
  const ok = await loadScript();
  if (!ok || !window.grecaptcha) return null;
  try {
    await new Promise((resolve) => window.grecaptcha.ready(resolve));
    return await window.grecaptcha.execute(SITE_KEY, { action });
  } catch {
    return null;
  }
}
