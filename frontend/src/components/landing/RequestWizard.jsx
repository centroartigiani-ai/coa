import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Building2, Check, Droplets, Factory, Loader2, Paperclip, Wrench, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api, formatApiError } from "@/lib/api";
import { getRecaptchaToken } from "@/lib/recaptcha";

const TYPES = [
  { value: "Idraulico", icon: Droplets },
  { value: "Elettricista", icon: Zap },
  { value: "Piccole manutenzioni", icon: Wrench },
  { value: "Servizi per condomini", icon: Building2 },
  { value: "Servizi per aziende", icon: Factory },
];

const STEPS = ["I tuoi dati", "L'intervento", "Conferma"];
const FASCE_ORARIE = ["Mattina (8–13)", "Pomeriggio (13–18)"];
const INITIAL = { nome: "", cognome: "", telefono: "", email: "", indirizzo: "", tipo_intervento: "", descrizione: "", urgente: "no", data_preferita: "", fascia_oraria: "", note_orario: "" };

export default function RequestWizard({ open, onOpenChange }) {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState(INITIAL);
  const [photo, setPhoto] = useState(null);
  const [privacy, setPrivacy] = useState(false);
  const [sending, setSending] = useState(false);

  const now = new Date();
  const minDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const setDataPreferita = (e) => {
    const v = e.target.value;
    setForm({ ...form, data_preferita: v && v < minDate ? minDate : v });
  };

  const validStep = () => {
    if (step === 0) return form.nome.trim() && form.cognome.trim() && form.telefono.trim() && /.+@.+\..+/.test(form.email) && form.indirizzo.trim();
    if (step === 1) return form.tipo_intervento && form.descrizione.trim();
    return true;
  };

  const next = () => {
    if (!validStep()) {
      toast.error("Compila tutti i campi obbligatori per continuare.");
      return;
    }
    setStep(step + 1);
  };

  const close = (v) => {
    onOpenChange(v);
    if (!v) setTimeout(() => { setStep(0); setDone(false); }, 300);
  };

  const submit = async () => {
    if (!privacy) {
      toast.error("Devi accettare la Privacy Policy per inviare la richiesta.");
      return;
    }
    setSending(true);
    try {
      const recaptchaToken = await getRecaptchaToken("richiesta_intervento");
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      fd.append("privacy", "true");
      if (photo) fd.append("photo", photo);
      if (recaptchaToken) fd.append("recaptcha_token", recaptchaToken);
      await api.post("/requests", fd);
      setDone(true);
      setForm(INITIAL);
      setPhoto(null);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent data-testid="request-form-dialog" data-lenis-prevent className="bg-[#26241F] border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto overscroll-contain rounded-none">
        {done ? (
          <div data-testid="request-success" className="py-14 text-center">
            <motion.span
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-20 h-20 bg-[#F2A93B] flex items-center justify-center"
            >
              <Check className="w-10 h-10 text-[#1C1C1E]" strokeWidth={2.5} />
            </motion.span>
            <h3 className="mt-8 font-display text-3xl font-bold text-white">Richiesta inviata!</h3>
            <p className="mt-4 text-white/50 max-w-sm mx-auto">Il professionista più adatto ti ricontatterà al più presto. Tieni il telefono a portata di mano.</p>
            <button
              data-testid="request-success-close"
              onClick={() => close(false)}
              className="mt-10 bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-medium hover:bg-[#D98E1F] transition-colors"
            >
              Chiudi
            </button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B]">Richiesta gratuita — Varese e provincia</p>
              <DialogTitle className="font-display text-3xl font-bold text-white">Richiedi un intervento</DialogTitle>
              <DialogDescription className="text-white/50">Rispondi a poche domande: il professionista più adatto ti ricontatta al più presto.</DialogDescription>
            </DialogHeader>

            <div className="mt-6 flex gap-2" data-testid="request-progress">
              {STEPS.map((label, i) => (
                <div key={label} className="flex-1">
                  <div data-testid={`request-progress-${i}`} className={`h-1 transition-colors duration-500 ${i <= step ? "bg-[#F2A93B]" : "bg-white/10"}`} />
                  <p className={`mt-2 text-[10px] tracking-[0.15em] uppercase transition-colors ${i === step ? "text-white" : "text-white/30"}`}>{i + 1}. {label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 min-h-[320px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  data-testid={`request-step-${step}`}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
                      <div>
                        <label className="brutalist-label" htmlFor="req-nome">Nome *</label>
                        <input id="req-nome" data-testid="request-nome-input" autoComplete="given-name" value={form.nome} onChange={set("nome")} className="brutalist-input" placeholder="Mario" />
                      </div>
                      <div>
                        <label className="brutalist-label" htmlFor="req-cognome">Cognome *</label>
                        <input id="req-cognome" data-testid="request-cognome-input" autoComplete="family-name" value={form.cognome} onChange={set("cognome")} className="brutalist-input" placeholder="Rossi" />
                      </div>
                      <div>
                        <label className="brutalist-label" htmlFor="req-telefono">Telefono *</label>
                        <input id="req-telefono" data-testid="request-telefono-input" type="tel" inputMode="tel" autoComplete="tel" value={form.telefono} onChange={set("telefono")} className="brutalist-input" placeholder="+39 333 000 0000" />
                      </div>
                      <div>
                        <label className="brutalist-label" htmlFor="req-email">Email *</label>
                        <input id="req-email" data-testid="request-email-input" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set("email")} className="brutalist-input" placeholder="mario@email.it" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="brutalist-label" htmlFor="req-indirizzo">Indirizzo *</label>
                        <input id="req-indirizzo" data-testid="request-indirizzo-input" autoComplete="street-address" value={form.indirizzo} onChange={set("indirizzo")} className="brutalist-input" placeholder="Via Roma 1, Varese" />
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="space-y-8">
                      <div>
                        <label className="brutalist-label">Tipo di intervento *</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {TYPES.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              data-testid={`request-tipo-${t.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                              onClick={() => setForm({ ...form, tipo_intervento: t.value })}
                              className={`group p-4 border text-left transition-colors duration-300 ${
                                form.tipo_intervento === t.value ? "border-[#F2A93B] bg-[#F2A93B]/10" : "border-white/15 hover:border-white/40"
                              }`}
                            >
                              <t.icon className={`w-5 h-5 transition-colors ${form.tipo_intervento === t.value ? "text-[#F2A93B]" : "text-white/40 group-hover:text-white/70"}`} strokeWidth={1.5} />
                              <p className={`mt-3 text-sm font-medium transition-colors ${form.tipo_intervento === t.value ? "text-white" : "text-white/60"}`}>{t.value}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="brutalist-label" htmlFor="req-descrizione">Descrizione del problema *</label>
                        <textarea id="req-descrizione" data-testid="request-descrizione-input" rows={3} maxLength={600} value={form.descrizione} onChange={set("descrizione")} className="brutalist-input resize-none" placeholder="Descrivi brevemente il problema..." />
                        <p className="mt-1 text-[10px] text-white/30 text-right">{form.descrizione.length}/600</p>
                      </div>
                      <div>
                        <label className="brutalist-label">Urgente? *</label>
                        <div className="grid grid-cols-2 gap-3" data-testid="request-urgente-toggle">
                          {[{ v: "no", label: "No, posso aspettare" }, { v: "si", label: "Sì, è urgente" }].map((o) => (
                            <button
                              key={o.v}
                              type="button"
                              data-testid={`request-urgente-${o.v}`}
                              onClick={() => setForm({ ...form, urgente: o.v })}
                              className={`px-4 py-4 text-sm font-medium border transition-colors duration-300 ${
                                form.urgente === o.v
                                  ? o.v === "si" ? "bg-[#F2A93B] border-[#F2A93B] text-[#1C1C1E]" : "border-white bg-white/10 text-white"
                                  : "border-white/15 text-white/50 hover:border-white/40"
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="brutalist-label" htmlFor="req-data">Data preferita (opzionale)</label>
                          <input
                            id="req-data"
                            data-testid="request-data-preferita-input"
                            type="date"
                            min={minDate}
                            value={form.data_preferita}
                            onChange={setDataPreferita}
                            className="brutalist-input"
                            style={{ colorScheme: "dark" }}
                          />
                        </div>
                        <div>
                          <label className="brutalist-label">Fascia oraria (opzionale)</label>
                          <div className="grid grid-cols-2 gap-2" data-testid="request-fascia-oraria-group">
                            {FASCE_ORARIE.map((f) => (
                              <button
                                key={f}
                                type="button"
                                data-testid={`request-fascia-${f.split(" ")[0].toLowerCase()}`}
                                onClick={() => setForm({ ...form, fascia_oraria: form.fascia_oraria === f ? "" : f })}
                                className={`px-2 py-3 text-xs font-medium border transition-colors duration-300 ${
                                  form.fascia_oraria === f ? "border-[#F2A93B] bg-[#F2A93B]/10 text-white" : "border-white/15 text-white/50 hover:border-white/40"
                                }`}
                              >
                                {f}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="brutalist-label" htmlFor="req-note-orario">Note orario (opzionale)</label>
                        <input
                          id="req-note-orario"
                          data-testid="request-note-orario-input"
                          maxLength={120}
                          value={form.note_orario}
                          onChange={set("note_orario")}
                          className="brutalist-input"
                          placeholder="Es. solo dopo le 16, chiamare prima, ecc."
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-6">
                      <div data-testid="request-summary" className="border border-white/10 divide-y divide-white/5">
                        {[
                          ["Nome", `${form.nome} ${form.cognome}`],
                          ["Telefono", form.telefono],
                          ["Email", form.email],
                          ["Indirizzo", form.indirizzo],
                          ["Intervento", form.tipo_intervento],
                          ["Urgente", form.urgente === "si" ? "Sì" : "No"],
                          ...(form.data_preferita ? [["Data preferita", new Date(`${form.data_preferita}T00:00:00`).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric" })]] : []),
                          ...(form.fascia_oraria ? [["Fascia oraria", form.fascia_oraria]] : []),
                          ...(form.note_orario ? [["Note orario", form.note_orario]] : []),
                          ["Problema", form.descrizione],
                        ].map(([k, v]) => (
                          <div key={k} className="flex gap-4 px-4 py-3 text-sm">
                            <span className="w-28 shrink-0 text-[10px] tracking-[0.15em] uppercase text-white/40 pt-1">{k}</span>
                            <span className="text-white/80">{v}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="brutalist-label">Carica foto (opzionale)</label>
                        <label data-testid="request-photo-upload" className="flex items-center gap-3 border border-dashed border-white/20 px-4 py-4 cursor-pointer hover:border-[#F2A93B] transition-colors text-white/50 text-sm">
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
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          data-testid="request-privacy-checkbox"
                          checked={privacy}
                          onChange={(e) => setPrivacy(e.target.checked)}
                          className="mt-0.5 w-4 h-4 shrink-0 accent-[#F2A93B] cursor-pointer"
                        />
                        <span className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">
                          Ho letto e accetto la <a href="/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#F2A93B] underline underline-offset-2">Privacy Policy</a> e acconsento al trattamento dei miei dati personali per la gestione della richiesta. *
                        </span>
                      </label>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex gap-3">
              {step > 0 && (
                <button
                  data-testid="request-back-button"
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-2 border border-white/20 text-white/70 px-6 py-4 text-sm font-medium hover:border-white hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Indietro
                </button>
              )}
              {step < 2 ? (
                <button
                  data-testid="request-next-button"
                  type="button"
                  onClick={next}
                  className="flex-1 bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-medium hover:bg-[#D98E1F] transition-colors inline-flex items-center justify-center gap-2"
                >
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  data-testid="request-submit-button"
                  type="button"
                  onClick={submit}
                  disabled={sending}
                  className="flex-1 bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-medium hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
                >
                  {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {sending ? "Invio in corso..." : "Invia richiesta"}
                </button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
