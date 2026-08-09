import { useEffect, useState } from "react";

const CBID = process.env.REACT_APP_COOKIEBOT_ID;

function enableStatistics() {
  document.querySelectorAll('script[type="text/plain"][data-cookieconsent]').forEach((s) => {
    const n = document.createElement("script");
    n.text = s.textContent;
    s.parentNode.replaceChild(n, s);
  });
}

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (CBID) {
      const s = document.createElement("script");
      s.id = "Cookiebot";
      s.src = "https://consent.cookiebot.com/uc.js";
      s.setAttribute("data-cbid", CBID);
      s.setAttribute("data-blockingmode", "auto");
      document.head.appendChild(s);
      return;
    }
    const stored = localStorage.getItem("coa_cookie_consent");
    if (!stored) setShow(true);
    else if (stored === "accepted") enableStatistics();
  }, []);

  const choose = (v) => {
    localStorage.setItem("coa_cookie_consent", v);
    if (v === "accepted") enableStatistics();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div data-testid="cookie-banner" className="fixed bottom-0 left-0 right-0 z-[100] bg-[#26241F] border-t border-white/10">
      <div className="px-6 md:px-12 mx-auto max-w-7xl py-6 flex flex-col md:flex-row md:items-center gap-6">
        <p className="text-sm text-white/60 flex-1 leading-relaxed">
          Questo sito utilizza cookie tecnici necessari al funzionamento e, previo consenso, cookie statistici per migliorare l'esperienza.
          Puoi accettare, rifiutare o leggere la <a data-testid="cookie-banner-policy-link" href="/cookie-policy" className="text-[#F2A93B] underline underline-offset-2">Cookie Policy</a>.
        </p>
        <div className="flex gap-3 shrink-0">
          <button
            data-testid="cookie-reject-button"
            onClick={() => choose("rejected")}
            className="border border-white/20 text-white/70 px-6 py-3 text-sm font-medium hover:border-white hover:text-white transition-colors"
          >
            Rifiuta
          </button>
          <button
            data-testid="cookie-accept-button"
            onClick={() => choose("accepted")}
            className="bg-[#F2A93B] text-[#1C1C1E] px-6 py-3 text-sm font-medium hover:bg-[#D98E1F] transition-colors"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
