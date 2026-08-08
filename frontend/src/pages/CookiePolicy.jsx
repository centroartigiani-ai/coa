import { useEffect } from "react";
import { Wrench } from "lucide-react";

const CBID = process.env.REACT_APP_COOKIEBOT_ID;

const Section = ({ title, children }) => (
  <section className="mt-12">
    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{title}</h2>
    <div className="mt-4 text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function CookiePolicy() {
  useEffect(() => {
    if (CBID) {
      const s = document.createElement("script");
      s.id = "CookieDeclaration";
      s.src = `https://consent.cookiebot.com/${CBID}/cd.js`;
      const el = document.getElementById("cookie-declaration-container");
      if (el) el.appendChild(s);
    }
  }, []);

  const renewConsent = () => {
    if (window.Cookiebot) {
      window.Cookiebot.renew();
    } else {
      localStorage.removeItem("coa_cookie_consent");
      window.location.reload();
    }
  };

  return (
    <div data-testid="cookie-policy-page" className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="px-6 md:px-12 mx-auto max-w-7xl h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="w-9 h-9 bg-[#FF5A00] flex items-center justify-center"><Wrench className="w-4 h-4 text-black" strokeWidth={2.5} /></span>
            <span className="font-display font-black text-lg">COA</span>
          </a>
          <a data-testid="cookie-policy-back" href="/" className="text-sm text-white/60 hover:text-white transition-colors">← Torna al sito</a>
        </div>
      </header>
      <main className="px-6 md:px-12 mx-auto max-w-3xl py-16">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00]">Documento legale</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-black tracking-tight">Cookie Policy</h1>
        <p className="mt-4 text-white/40 text-sm">Ultimo aggiornamento: 7 agosto 2026</p>

        <button data-testid="cookie-renew-button" onClick={renewConsent} className="mt-8 border border-[#FF5A00] text-[#FF5A00] px-6 py-3 text-sm font-medium hover:bg-[#FF5A00] hover:text-white transition-colors">
          Modifica o revoca il tuo consenso
        </button>

        <Section title="1. Cosa sono i cookie">
          <p>I cookie sono piccoli file di testo che i siti visitati inviano al dispositivo dell'utente, dove vengono memorizzati per essere ritrasmessi agli stessi siti alla visita successiva. Esistono cookie tecnici (necessari al funzionamento del sito) e cookie non tecnici (statistici, di profilazione, di terze parti).</p>
        </Section>

        <Section title="2. Cookie tecnici (sempre attivi)">
          <p>Questi cookie sono indispensabili per il funzionamento del sito e non richiedono il consenso (art. 122 del Codice Privacy e linee guida del Garante):</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">access_token / refresh_token</strong> — cookie di sessione dell'area riservata amministratore (httpOnly, sicuri);</li>
            <li><strong className="text-white">coa_cookie_consent</strong> — memorizza la tua scelta sul consenso cookie;</li>
            <li>cookie tecnici del fornitore di consenso (Cookiebot), se attivo.</li>
          </ul>
        </Section>

        <Section title="3. Cookie statistici (solo con consenso)">
          <p>Utilizziamo <strong className="text-white">PostHog</strong> per statistiche aggregate di utilizzo del sito (pagine visitate, interazioni anonime). Questi strumenti vengono caricati <strong className="text-white">esclusivamente dopo il tuo consenso esplicito</strong>: fino a quel momento lo script è bloccato e nessun dato viene raccolto.</p>
        </Section>

        <Section title="4. Servizi di terze parti senza cookie">
          <p>Il sito carica i caratteri tipografici da Fontshare (api.fontshare.com): il servizio riceve l'indirizzo IP tecnico necessario alla consegna dei font ma non installa cookie. Non utilizziamo Google Maps, YouTube, pixel pubblicitari o social plugin.</p>
        </Section>

        <Section title="5. Gestione del consenso">
          <p>Al primo accesso ti viene mostrato un banner con le opzioni Accetta e Rifiuta. Puoi modificare o revocare la tua scelta in qualsiasi momento dal pulsante in alto in questa pagina. La revoca non pregiudica la liceità del trattamento precedente.</p>
        </Section>

        <Section title="6. Disabilitazione dal browser">
          <p>Puoi inoltre gestire o eliminare i cookie direttamente dalle impostazioni del tuo browser (Chrome, Firefox, Safari, Edge). La disabilitazione dei cookie tecnici può compromettere l'uso dell'area riservata.</p>
        </Section>

        <div id="cookie-declaration-container" className="mt-16" />
        {!CBID && (
          <p className="mt-16 text-xs text-white/30">La dichiarazione dettagliata dei cookie (Cookiebot) si attiva automaticamente una volta configurato l'ID dominio Cookiebot.</p>
        )}
      </main>
    </div>
  );
}
