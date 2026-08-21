import { useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";
import { getRecaptchaToken } from "@/lib/recaptcha";

const PROFESSIONI = ["Idraulico", "Elettricista", "Piccole manutenzioni", "Altro"];
const ESPERIENZA = ["0-2 anni", "3-5 anni", "6-10 anni", "Oltre 10 anni"];

const INITIAL = {
  nome: "", cognome: "", ragione_sociale: "", partita_iva: "", telefono: "",
  email: "", password: "", professione: "", zone_coperte: "", anni_esperienza: "", messaggio: "",
  whatsapp_apikey: "",
};

export default function PartnerFormDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(INITIAL);
  const [file, setFile] = useState(null);
  const [privacy, setPrivacy] = useState(false);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!privacy) {
      toast.error("Devi accettare la Privacy Policy per inviare la candidatura.");
      return;
    }
    setSending(true);
    try {
      const recaptchaToken = await getRecaptchaToken("candidatura_partner");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("privacy", "true");
      if (file) fd.append("attachment", file);
      if (recaptchaToken) fd.append("recaptcha_token", recaptchaToken);
      await api.post("/partners", fd);
      toast.success("Candidatura inviata! Ti ricontatteremo presto.");
      setForm(INITIAL);
      setFile(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="partner-form-dialog" data-lenis-prevent className="bg-[#26241F] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-none">
        <DialogHeader>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B]">Diventa partner</p>
          <DialogTitle className="font-display text-3xl font-bold text-white">Candidati come Partner</DialogTitle>
          <DialogDescription className="text-white/50">Ricevi richieste di lavoro qualificate senza investire in pubblicità.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="brutalist-label" htmlFor="par-nome">Nome *</label>
            <input id="par-nome" data-testid="partner-nome-input" required value={form.nome} onChange={set("nome")} className="brutalist-input" placeholder="Luigi" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-cognome">Cognome *</label>
            <input id="par-cognome" data-testid="partner-cognome-input" required value={form.cognome} onChange={set("cognome")} className="brutalist-input" placeholder="Bianchi" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-ragione">Ragione sociale *</label>
            <input id="par-ragione" data-testid="partner-ragione-input" required value={form.ragione_sociale} onChange={set("ragione_sociale")} className="brutalist-input" placeholder="Bianchi Impianti SNC" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-piva">Partita IVA *</label>
            <input id="par-piva" data-testid="partner-piva-input" required value={form.partita_iva} onChange={set("partita_iva")} className="brutalist-input" placeholder="01234567890" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-telefono">Telefono *</label>
            <input id="par-telefono" data-testid="partner-telefono-input" required type="tel" value={form.telefono} onChange={set("telefono")} className="brutalist-input" placeholder="+39 333 000 0000" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-email">Email *</label>
            <input id="par-email" data-testid="partner-email-input" required type="email" value={form.email} onChange={set("email")} className="brutalist-input" placeholder="luigi@impianti.it" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="par-password">Password *</label>
            <input id="par-password" data-testid="partner-password-input" required type="password" minLength={8} value={form.password} onChange={set("password")} className="brutalist-input" placeholder="Minimo 8 caratteri" />
            <p className="mt-1.5 text-[10px] text-white/30">Servirà per accedere alla tua area riservata partner.</p>
          </div>
          <div>
            <label className="brutalist-label">Professione *</label>
            <Select required value={form.professione} onValueChange={(v) => setForm({ ...form, professione: v })}>
              <SelectTrigger data-testid="partner-professione-select" className="brutalist-input h-auto">
                <SelectValue placeholder="Seleziona la professione" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                {PROFESSIONI.map((p) => (
                  <SelectItem key={p} value={p} data-testid={`partner-professione-${p.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="focus:bg-[#F2A93B] focus:text-[#1C1C1E]">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="brutalist-label">Anni di esperienza *</label>
            <Select required value={form.anni_esperienza} onValueChange={(v) => setForm({ ...form, anni_esperienza: v })}>
              <SelectTrigger data-testid="partner-esperienza-select" className="brutalist-input h-auto">
                <SelectValue placeholder="Seleziona" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                {ESPERIENZA.map((p) => (
                  <SelectItem key={p} value={p} data-testid={`partner-esperienza-${p.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`} className="focus:bg-[#F2A93B] focus:text-[#1C1C1E]">
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label" htmlFor="par-zone">Zone coperte *</label>
            <input id="par-zone" data-testid="partner-zone-input" required value={form.zone_coperte} onChange={set("zone_coperte")} className="brutalist-input" placeholder="Es. Varese e comuni della provincia" />
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label" htmlFor="par-wa">Notifiche WhatsApp — apikey CallMeBot (opzionale)</label>
            <input id="par-wa" data-testid="partner-whatsapp-apikey-input" value={form.whatsapp_apikey} onChange={set("whatsapp_apikey")} className="brutalist-input" placeholder="Lascia vuoto se non ti interessa" />
            <p className="mt-1.5 text-[11px] text-white/40 leading-relaxed">
              Per ricevere notifiche istantanee su WhatsApp quando ti assegniamo un lavoro: manda "I allow callmebot to send me messages" al numero +34 644 51 95 23 su WhatsApp, poi incolla qui la apikey che ricevi in risposta. Potrai farlo anche dopo, dalla tua area riservata.
            </p>
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label" htmlFor="par-messaggio">Messaggio</label>
            <textarea id="par-messaggio" data-testid="partner-messaggio-input" rows={3} value={form.messaggio} onChange={set("messaggio")} className="brutalist-input resize-none" placeholder="Raccontaci brevemente la tua attività..." />
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label">Allega visura/CV (opzionale)</label>
            <label data-testid="partner-attachment-upload" className="flex items-center gap-3 border border-dashed border-white/20 px-4 py-4 cursor-pointer hover:border-[#F2A93B] transition-colors text-white/50 text-sm">
              <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              {file ? file.name : "Scegli un file (max 5MB)"}
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFile(e.target.files[0] || null)} />
              {file && (
                <button type="button" data-testid="partner-attachment-remove" onClick={(e) => { e.preventDefault(); setFile(null); }} className="ml-auto text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                data-testid="partner-privacy-checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 shrink-0 accent-[#F2A93B] cursor-pointer"
              />
              <span className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                Ho letto e accetto la <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#F2A93B] underline underline-offset-2">Privacy Policy</a> e acconsento al trattamento dei miei dati personali per la valutazione della candidatura. *
              </span>
            </label>
          </div>
          <div className="sm:col-span-2 pt-2">
            <button
              data-testid="partner-submit-button"
              type="submit"
              disabled={sending}
              className="w-full bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-medium hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? "Invio in corso..." : "Invia candidatura"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
