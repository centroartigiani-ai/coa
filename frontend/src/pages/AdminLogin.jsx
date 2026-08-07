import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Wrench } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { formatApiError } from "@/lib/api";

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(formatApiError(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="admin-login-page" className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
      <div className="noise-overlay" />
      <div className="w-full max-w-md bg-[#111111] border border-white/10 p-10">
        <div className="flex items-center gap-3 mb-10">
          <span className="w-9 h-9 bg-[#FF5A00] flex items-center justify-center">
            <Wrench className="w-4 h-4 text-black" strokeWidth={2.5} />
          </span>
          <div>
            <p className="font-display font-black text-white text-lg leading-none">COA</p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-white/50">Area riservata</p>
          </div>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div>
            <label className="brutalist-label" htmlFor="admin-email">Email</label>
            <input id="admin-email" data-testid="admin-login-email-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="brutalist-input" placeholder="admin@coa-varese.it" />
          </div>
          <div>
            <label className="brutalist-label" htmlFor="admin-password">Password</label>
            <input id="admin-password" data-testid="admin-login-password-input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="brutalist-input" placeholder="••••••••" />
          </div>
          {error && <p data-testid="admin-login-error" className="text-sm text-red-400">{error}</p>}
          <button
            data-testid="admin-login-submit-button"
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5A00] text-white px-8 py-4 font-medium hover:bg-[#E04F00] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Accedi
          </button>
        </form>
        <a data-testid="admin-login-back-link" href="/" className="block mt-8 text-sm text-white/40 hover:text-white transition-colors">← Torna al sito</a>
      </div>
    </div>
  );
}
