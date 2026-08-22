import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";

export default function PartnerLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await login(email, password);
      if (data.role !== "partner") {
        setError("Questo account non è un account partner.");
        return;
      }
      navigate("/partner");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const submitForgot = async (e) => {
    e.preventDefault();
    setForgotMsg("");
    setError("");
    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotMsg(data.message || "Se l'email è registrata, riceverai a breve un link per reimpostare la password.");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div data-testid="partner-login-page" className="min-h-screen bg-[#1C1C1E] flex items-center justify-center px-6">
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
        <p className="text-sm text-[#F5F1EA]/50 mb-8">Accedi con l'email e la password scelte in fase di candidatura.</p>
        {forgot ? (
          <form onSubmit={submitForgot} className="space-y-6" data-testid="forgot-form">
            <div>
              <label className="brutalist-label" htmlFor="forgot-email">Email del tuo account</label>
              <input id="forgot-email" data-testid="forgot-email-input" type="email" required value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} className="brutalist-input" placeholder="la-tua@email.it" />
            </div>
            {forgotMsg && <p data-testid="forgot-success" className="text-sm text-[#4CAF7D]">{forgotMsg}</p>}
            {error && <p data-testid="forgot-error" className="text-sm text-red-400">{error}</p>}
            <button
              data-testid="forgot-submit-button"
              type="submit"
              disabled={forgotLoading}
              className="w-full bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {forgotLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Invia link di reset
            </button>
            <button type="button" data-testid="forgot-back-button" onClick={() => { setForgot(false); setError(""); setForgotMsg(""); }} className="w-full text-sm text-[#F5F1EA]/50 hover:text-[#F5F1EA] transition-colors">
              ← Torna al login
            </button>
          </form>
        ) : (
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="brutalist-label" htmlFor="partner-email">Email</label>
            <input id="partner-email" data-testid="partner-login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="brutalist-input" placeholder="la-tua@email.it" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="partner-password">Password</label>
            <input id="partner-password" data-testid="partner-login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="brutalist-input" placeholder="••••••••" />
            <button type="button" data-testid="forgot-password-link" onClick={() => { setForgot(true); setForgotEmail(email); setError(""); }} className="mt-2 text-xs text-[#F5F1EA]/40 hover:text-[#F2A93B] transition-colors">
              Password dimenticata?
            </button>
          </div>
          {error && <p data-testid="partner-login-error" className="text-sm text-red-400">{error}</p>}
          <button
            data-testid="partner-login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold hover:bg-[#D98E1F] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Accedi
          </button>
        </form>
        )}
        <a data-testid="partner-login-back-link" href="/" className="block mt-8 text-sm text-[#F5F1EA]/40 hover:text-[#F5F1EA] transition-colors">← Torna al sito</a>
      </div>
    </div>
  );
}
