import { useState } from "react";
import { useParams } from "react-router-dom";
import { Check, Loader2, Wrench } from "lucide-react";
import { api, formatApiError } from "@/lib/api";

export default function PartnerResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("La password deve avere almeno 8 caratteri.");
      return;
    }
    if (password !== confirm) {
      setError("Le due password non coincidono.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setDone(true);
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="partner-reset-page" className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-6">
      <div className="noise-overlay" />
      <div className="w-full max-w-md bg-[#26241F] border border-[#F5F1EA]/10 p-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-9 h-9 bg-[#F2A93B] flex items-center justify-center">
            <Wrench className="w-4 h-4 text-[#1C1C1E]" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display font-bold text-[#F5F1EA] text-lg leading-none">COA Partner</p>
            <p className="font-mono-data text-[10px] tracking-[0.2em] uppercase text-[#F5F1EA]/50">Area riservata artigiani</p>
          </div>
        </div>
        {done ? (
          <div data-testid="reset-success" className="text-center py-6">
            <span className="mx-auto w-14 h-14 bg-[#F2A93B] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#1C1C1E]" strokeWidth={2.5} />
            </span>
            <p className="mt-6 font-display text-xl font-bold text-[#F5F1EA]">Password aggiornata!</p>
            <p className="mt-2 text-sm text-[#F5F1EA]/50">Ora puoi accedere con la nuova password.</p>
            <a data-testid="reset-goto-login" href="/partner/login" className="mt-8 inline-block bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold hover:bg-[#D98E1F] transition-colors">
              Vai al login
            </a>
          </div>
        ) : (
          <>
            <p className="text-sm text-[#F5F1EA]/50 mb-8">Scegli una nuova password per il tuo account (minimo 8 caratteri).</p>
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className="brutalist-label" htmlFor="reset-password">Nuova password</label>
                <input id="reset-password" data-testid="reset-password-input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="brutalist-input" placeholder="••••••••" />
              </div>
              <div>
                <label className="brutalist-label" htmlFor="reset-confirm">Conferma password</label>
                <input id="reset-confirm" data-testid="reset-confirm-input" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="brutalist-input" placeholder="••••••••" />
              </div>
              {error && <p data-testid="reset-error" className="text-sm text-red-400">{error}</p>}
              <button
                data-testid="reset-submit-button"
                type="submit"
                disabled={loading}
                className="w-full bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Reimposta password
              </button>
            </form>
          </>
        )}
        <a data-testid="reset-back-link" href="/partner/login" className="block mt-8 text-sm text-[#F5F1EA]/40 hover:text-[#F5F1EA] transition-colors">← Torna al login</a>
      </div>
    </div>
  );
}
