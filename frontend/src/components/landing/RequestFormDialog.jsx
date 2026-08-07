import { useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";

const TYPES = [
  "Idraulico", "Elettricista", "Climatizzazione", "Caldaie", "Manutenzione impianti",
  "Piccole manutenzioni", "Intervento urgente", "Servizi per condomini", "Servizi per aziende",
];

const INITIAL = { nome: "", cognome: "", telefono: "", email: "", comune: "", indirizzo: "", tipo_intervento: "", descrizione: "", urgente: "no" };

export default function RequestFormDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(INITIAL);
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (photo) fd.append("photo", photo);
      await api.post("/requests", fd);
      toast.success("Richiesta inviata! Verrai ricontattato entro 15 minuti.");
      setForm(INITIAL);
      setPhoto(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="request-form-dialog" className="bg-[#111111] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto rounded-none">
        <DialogHeader>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00]">Richiesta gratuita</p>
          <DialogTitle className="font-display text-3xl font-bold text-white">Richiedi un intervento</DialogTitle>
          <DialogDescription className="text-white/50">Compila il modulo: il professionista più vicino ti ricontatta entro 15 minuti.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          <div>
            <label className="brutalist-label" htmlFor="req-nome">Nome *</label>
            <input id="req-nome" data-testid="request-nome-input" required value={form.nome} onChange={set("nome")} className="brutalist-input" placeholder="Mario" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="req-cognome">Cognome *</label>
            <input id="req-cognome" data-testid="request-cognome-input" required value={form.cognome} onChange={set("cognome")} className="brutalist-input" placeholder="Rossi" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="req-telefono">Telefono *</label>
            <input id="req-telefono" data-testid="request-telefono-input" required type="tel" value={form.telefono} onChange={set("telefono")} className="brutalist-input" placeholder="+39 333 000 0000" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="req-email">Email *</label>
            <input id="req-email" data-testid="request-email-input" required type="email" value={form.email} onChange={set("email")} className="brutalist-input" placeholder="mario@email.it" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="req-comune">Comune *</label>
            <input id="req-comune" data-testid="request-comune-input" required value={form.comune} onChange={set("comune")} className="brutalist-input" placeholder="Varese" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="req-indirizzo">Indirizzo *</label>
            <input id="req-indirizzo" data-testid="request-indirizzo-input" required value={form.indirizzo} onChange={set("indirizzo")} className="brutalist-input" placeholder="Via Roma 1" />
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label">Tipo di intervento *</label>
            <Select required value={form.tipo_intervento} onValueChange={(v) => setForm({ ...form, tipo_intervento: v })}>
              <SelectTrigger data-testid="request-tipo-select" className="brutalist-input h-auto">
                <SelectValue placeholder="Seleziona il tipo di intervento" />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t} data-testid={`request-tipo-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="focus:bg-[#FF5A00] focus:text-white">
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label" htmlFor="req-descrizione">Descrizione del problema *</label>
            <textarea id="req-descrizione" data-testid="request-descrizione-input" required rows={3} value={form.descrizione} onChange={set("descrizione")} className="brutalist-input resize-none" placeholder="Descrivi brevemente il problema..." />
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label">Urgente? *</label>
            <div className="flex gap-3" data-testid="request-urgente-toggle">
              {["no", "si"].map((v) => (
                <button
                  key={v}
                  type="button"
                  data-testid={`request-urgente-${v}`}
                  onClick={() => setForm({ ...form, urgente: v })}
                  className={`px-8 py-3 text-sm font-medium border transition-colors ${
                    form.urgente === v ? "bg-[#FF5A00] border-[#FF5A00] text-white" : "border-white/20 text-white/60 hover:border-white/50"
                  }`}
                >
                  {v === "si" ? "Sì" : "No"}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="brutalist-label">Carica foto (opzionale)</label>
            <label data-testid="request-photo-upload" className="flex items-center gap-3 border border-dashed border-white/20 px-4 py-4 cursor-pointer hover:border-[#FF5A00] transition-colors text-white/50 text-sm">
              <Paperclip className="w-4 h-4" strokeWidth={1.5} />
              {photo ? photo.name : "Scegli un'immagine (max 5MB)"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setPhoto(e.target.files[0] || null)} />
              {photo && (
                <button type="button" data-testid="request-photo-remove" onClick={(e) => { e.preventDefault(); setPhoto(null); }} className="ml-auto text-white/40 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>
          <div className="sm:col-span-2 pt-2">
            <button
              data-testid="request-submit-button"
              type="submit"
              disabled={sending}
              className="w-full bg-[#FF5A00] text-white px-8 py-4 font-medium hover:bg-[#E04F00] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {sending && <Loader2 className="w-4 h-4 animate-spin" />}
              {sending ? "Invio in corso..." : "Invia richiesta"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
