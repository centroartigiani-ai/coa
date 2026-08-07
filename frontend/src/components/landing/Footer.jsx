import { useState } from "react";
import { Wrench, Phone, Mail } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const LEGAL = {
  privacy: {
    title: "Privacy Policy",
    body: "COA — Centrale Operativa Artigiani tratta i dati personali forniti tramite i moduli del sito esclusivamente per gestire le richieste di intervento e le candidature partner, nel rispetto del Regolamento (UE) 2016/679 (GDPR). I dati non vengono ceduti a terzi al di fuori dei professionisti incaricati dell'intervento. Per esercitare i tuoi diritti scrivi a info@coa-varese.it.",
  },
  cookie: {
    title: "Cookie Policy",
    body: "Questo sito utilizza esclusivamente cookie tecnici necessari al funzionamento del servizio e alla sicurezza dell'area riservata. Non vengono utilizzati cookie di profilazione di terze parti.",
  },
};

export default function Footer({ onPartner }) {
  const [legal, setLegal] = useState(null);

  const go = (href) => document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });

  return (
    <footer data-testid="footer" className="border-t border-white/10 bg-[#0A0A0A]">
      <div className="px-6 md:px-12 mx-auto max-w-7xl py-20">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 bg-[#FF5A00] flex items-center justify-center">
                <Wrench className="w-4 h-4 text-black" strokeWidth={2.5} />
              </span>
              <span className="font-display font-black text-white text-lg tracking-tight">COA</span>
            </div>
            <p className="mt-6 text-white/40 text-sm max-w-xs leading-relaxed">
              Centrale Operativa Artigiani. Il ponte tra chi ha un problema e chi sa risolverlo, in meno di 15 minuti.
            </p>
            <p className="font-display text-outline text-7xl md:text-8xl font-black uppercase mt-10 select-none">COA</p>
          </div>
          <div className="md:col-span-3">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/40 mb-6">Menu</p>
            <ul className="space-y-3">
              <li><button data-testid="footer-chi-siamo" onClick={() => go("#come-funziona")} className="text-white/70 hover:text-[#FF5A00] transition-colors">Chi siamo</button></li>
              <li><button data-testid="footer-servizi" onClick={() => go("#servizi")} className="text-white/70 hover:text-[#FF5A00] transition-colors">Servizi</button></li>
              <li><button data-testid="footer-partner" onClick={onPartner} className="text-white/70 hover:text-[#FF5A00] transition-colors">Diventa Partner</button></li>
              <li><button data-testid="footer-contatti" onClick={() => go("#faq")} className="text-white/70 hover:text-[#FF5A00] transition-colors">Contatti</button></li>
            </ul>
          </div>
          <div className="md:col-span-4">
            <p className="text-xs font-bold tracking-[0.25em] uppercase text-white/40 mb-6">Contatti</p>
            <a data-testid="footer-phone" href="tel:+390332000000" className="flex items-center gap-3 text-white/70 hover:text-[#FF5A00] transition-colors">
              <Phone className="w-4 h-4" strokeWidth={1.5} /> +39 0332 000 000
            </a>
            <a data-testid="footer-email" href="mailto:info@coa-varese.it" className="mt-3 flex items-center gap-3 text-white/70 hover:text-[#FF5A00] transition-colors">
              <Mail className="w-4 h-4" strokeWidth={1.5} /> info@coa-varese.it
            </a>
            <div className="mt-8 flex gap-6">
              <button data-testid="footer-privacy" onClick={() => setLegal("privacy")} className="text-sm text-white/40 hover:text-white transition-colors">Privacy Policy</button>
              <button data-testid="footer-cookie" onClick={() => setLegal("cookie")} className="text-sm text-white/40 hover:text-white transition-colors">Cookie Policy</button>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-white/30">
          <p>© 2026 COA — Centrale Operativa Artigiani. Tutti i diritti riservati.</p>
          <a data-testid="footer-admin-link" href="/admin/login" className="hover:text-white/60 transition-colors">Area riservata</a>
        </div>
      </div>

      <Dialog open={!!legal} onOpenChange={() => setLegal(null)}>
        <DialogContent data-testid="legal-dialog" className="bg-[#111111] border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl text-white">{legal && LEGAL[legal].title}</DialogTitle>
          </DialogHeader>
          <p className="text-white/60 text-sm leading-relaxed">{legal && LEGAL[legal].body}</p>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
