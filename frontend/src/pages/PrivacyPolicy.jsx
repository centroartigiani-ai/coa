import { Wrench } from "lucide-react";

const Section = ({ title, children }) => (
  <section className="mt-12">
    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">{title}</h2>
    <div className="mt-4 text-white/60 text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  return (
    <div data-testid="privacy-policy-page" className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="px-6 md:px-12 mx-auto max-w-7xl h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <span className="w-9 h-9 bg-[#FF5A00] flex items-center justify-center"><Wrench className="w-4 h-4 text-black" strokeWidth={2.5} /></span>
            <span className="font-display font-black text-lg">COA</span>
          </a>
          <a data-testid="privacy-policy-back" href="/" className="text-sm text-white/60 hover:text-white transition-colors">← Torna al sito</a>
        </div>
      </header>
      <main className="px-6 md:px-12 mx-auto max-w-3xl py-16">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00]">Documento legale — GDPR (UE) 2016/679</p>
        <h1 className="mt-4 font-display text-4xl md:text-5xl font-black tracking-tight">Privacy Policy</h1>
        <p className="mt-4 text-white/40 text-sm">Ultimo aggiornamento: 7 agosto 2026</p>

        <Section title="1. Titolare del trattamento">
          <p>Il titolare del trattamento è <strong className="text-white">COA — Centrale Operativa Artigiani</strong> (ragione sociale e partita IVA: da completare a cura del titolare), operativo in Varese e provincia.</p>
          <p>Contatti del titolare: email <a href="mailto:centro.artigiani@gmail.com" className="text-[#FF5A00] underline underline-offset-2">centro.artigiani@gmail.com</a> — telefono <a href="tel:+393520248313" className="text-[#FF5A00] underline underline-offset-2">+39 352 024 8313</a>.</p>
        </Section>

        <Section title="2. Dati personali raccolti">
          <p>Tramite il modulo "Richiedi un intervento": nome, cognome, telefono, email, indirizzo, tipo di intervento, descrizione del problema, eventuale fotografia del danno caricata volontariamente.</p>
          <p>Tramite il modulo "Diventa Partner": nome, cognome, ragione sociale, partita IVA, telefono, email, professione, zone coperte, anni di esperienza, messaggio libero, eventuale CV o visura camerale caricata volontariamente.</p>
          <p>Tramite la navigazione: dati tecnici di connessione (indirizzo IP, browser) e — solo previo consenso — statistiche di utilizzo aggregate. Non raccogliamo categorie particolari di dati (art. 9 GDPR).</p>
        </Section>

        <Section title="3. Finalità e base giuridica">
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-white">Gestione delle richieste di intervento</strong>: ricontatto, assegnazione dell'artigiano, organizzazione del lavoro — base giuridica: esecuzione di misure precontrattuali (art. 6.1.b GDPR) e consenso (art. 6.1.a);</li>
            <li><strong className="text-white">Valutazione delle candidature partner</strong>: verifica dei requisiti professionali — base giuridica: misure precontrattuali (art. 6.1.b);</li>
            <li><strong className="text-white">Obblighi di legge e tutela dei diritti</strong> — base giuridica: obbligo legale (art. 6.1.c) e legittimo interesse (art. 6.1.f);</li>
            <li><strong className="text-white">Statistiche di utilizzo del sito</strong> — base giuridica: consenso (art. 6.1.a), revocabile in qualsiasi momento.</li>
          </ul>
        </Section>

        <Section title="4. Comunicazione dei dati a terzi">
          <p>Per evadere la tua richiesta, i dati necessari (nome, contatti, indirizzo, descrizione, eventuale foto) vengono comunicati <strong className="text-white">all'artigiano partner assegnato all'intervento</strong>, che li tratta in qualità di autonomo titolare limitatamente all'esecuzione del lavoro.</p>
          <p>I dati non vengono venduti né comunicati a terzi per finalità di marketing.</p>
        </Section>

        <Section title="5. Fornitori di servizi (responsabili del trattamento)">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Hosting e infrastruttura</strong>: piattaforma cloud del fornitore tecnico del sito;</li>
            <li><strong className="text-white">Resend</strong>: invio delle email di notifica al titolare;</li>
            <li><strong className="text-white">CallMeBot</strong>: inoltro delle notifiche WhatsApp al titolare;</li>
            <li><strong className="text-white">Cookiebot</strong>: gestione del consenso cookie (se attivo);</li>
            <li><strong className="text-white">PostHog</strong>: statistiche aggregate, solo previo consenso.</li>
          </ul>
          <p>Alcuni fornitori possono trattare dati fuori dall'UE: in tal caso il trasferimento avviene nel rispetto degli artt. 44 e ss. GDPR (decisioni di adeguatezza o clausole contrattuali standard).</p>
        </Section>

        <Section title="6. Conservazione dei dati">
          <p>Le richieste di intervento sono conservate per il tempo necessario alla gestione del rapporto e comunque non oltre 24 mesi. Le candidature partner non accolte sono conservate massimo 12 mesi. I log tecnici e i dati di consenso sono conservati secondo i termini di legge. Decorso il termine, i dati vengono cancellati o anonimizzati.</p>
        </Section>

        <Section title="7. Sicurezza">
          <p>Il sito utilizza connessione cifrata HTTPS, accesso all'area riservata con credenziali protette da hashing (bcrypt), cookie di sessione httpOnly e protezione contro i tentativi di accesso ripetuti. L'accesso ai dati è limitato al titolare e ai fornitori autorizzati.</p>
        </Section>

        <Section title="8. Diritti dell'interessato">
          <p>Puoi esercitare in qualsiasi momento i diritti previsti dagli artt. 15-22 GDPR: accesso, rettifica, cancellazione, limitazione, portabilità, opposizione e revoca del consenso. Scrivi a <a href="mailto:centro.artigiani@gmail.com" className="text-[#FF5A00] underline underline-offset-2">centro.artigiani@gmail.com</a>: risponderemo entro 30 giorni.</p>
          <p>Hai inoltre diritto di reclamo al <strong className="text-white">Garante per la protezione dei dati personali</strong> (www.garanteprivacy.it).</p>
        </Section>

        <Section title="9. Modifiche a questa informativa">
          <p>Il titolare può aggiornare questa informativa: la versione vigente è quella pubblicata su questa pagina con la relativa data di aggiornamento.</p>
        </Section>
      </main>
    </div>
  );
}
