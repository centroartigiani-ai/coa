import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Loader2, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

export default function ReviewPage() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [invalid, setInvalid] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");
  const [nome, setNome] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/reviews/token/${token}`)
      .then((r) => { setInfo(r.data); setNome(r.data.nome || ""); })
      .catch((e) => setInvalid(formatApiError(e.response?.data?.detail) || "Link non valido"));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error("Seleziona un voto in stelle."); return; }
    if (!text.trim()) { toast.error("Scrivi qualche riga sulla tua esperienza."); return; }
    setSending(true);
    try {
      await api.post("/reviews", { token, rating, text, nome });
      setDone(true);
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="review-page" className="min-h-screen bg-[#1C1C1E] text-[#F5F1EA] flex items-center justify-center px-6 py-16">
      <div className="noise-overlay" />
      <div className="w-full max-w-lg bg-[#26241F] border border-[#F5F1EA]/10 p-8 md:p-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-9 h-9 bg-[#F2A93B] flex items-center justify-center"><Wrench className="w-4 h-4 text-[#1C1C1E]" strokeWidth={2.5} /></span>
          <span className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#F5F1EA]/50">Centrale Operativa Artigiani</span>
        </div>

        {invalid ? (
          <div data-testid="review-invalid">
            <h1 className="font-display text-2xl font-bold">Link non valido</h1>
            <p className="mt-4 text-sm text-[#F5F1EA]/60">{invalid}</p>
            <a href="/" className="inline-block mt-8 text-sm text-[#F2A93B] underline underline-offset-2">Torna al sito</a>
          </div>
        ) : done ? (
          <div data-testid="review-success" className="text-center py-8">
            <span className="mx-auto w-16 h-16 bg-[#4CAF7D] flex items-center justify-center">
              <Check className="w-8 h-8 text-[#1C1C1E]" strokeWidth={2.5} />
            </span>
            <h1 className="mt-6 font-display text-2xl font-bold">Grazie per la tua recensione!</h1>
            <p className="mt-4 text-sm text-[#F5F1EA]/60">Sarà pubblicata sul sito dopo una rapida verifica da parte del nostro team.</p>
          </div>
        ) : !info ? (
          <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 text-[#F2A93B] animate-spin" /></div>
        ) : (
          <>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Com'è andato l'intervento?</h1>
            <p className="mt-3 text-sm text-[#F5F1EA]/60">Servizio: <span className="text-[#F2A93B] font-medium">{info.tipo_intervento}</span></p>
            <form onSubmit={submit} className="mt-8 space-y-7">
              <div>
                <label className="brutalist-label">Il tuo voto *</label>
                <div className="flex gap-2" data-testid="review-stars">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      data-testid={`review-star-${n}`}
                      onClick={() => setRating(n)}
                      onMouseEnter={() => setHover(n)}
                      onMouseLeave={() => setHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                      aria-label={`${n} stelle`}
                    >
                      <Star className={`w-9 h-9 transition-colors ${(hover || rating) >= n ? "text-[#F2A93B]" : "text-[#F5F1EA]/20"}`} fill={(hover || rating) >= n ? "#F2A93B" : "none"} strokeWidth={1.5} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="brutalist-label" htmlFor="rev-text">La tua esperienza *</label>
                <textarea id="rev-text" data-testid="review-text-input" rows={4} maxLength={600} value={text} onChange={(e) => setText(e.target.value)} className="brutalist-input resize-none" placeholder="Racconta come è andata..." />
              </div>
              <div>
                <label className="brutalist-label" htmlFor="rev-nome">Il tuo nome (mostrato sul sito)</label>
                <input id="rev-nome" data-testid="review-nome-input" value={nome} onChange={(e) => setNome(e.target.value)} className="brutalist-input" placeholder="Es. Marco R." />
              </div>
              <button
                data-testid="review-submit-button"
                type="submit"
                disabled={sending}
                className="w-full bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                Invia recensione
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
