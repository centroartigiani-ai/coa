import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { CheckCircle2, Loader2, LogOut, MessageCircle, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const ASSIGN_LABELS = { assegnata: "Da prendere in carico", accettata: "Presa in carico", completata: "Completata" };
const ASSIGN_COLORS = {
  assegnata: "text-[#F2A93B] border-[#F2A93B]/40 bg-[#F2A93B]/10",
  accettata: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  completata: "text-[#4CAF7D] border-[#4CAF7D]/40 bg-[#4CAF7D]/10",
};

function waNumber(phone) {
  const d = (phone || "").replace(/\D/g, "");
  if (!d) return null;
  return d.startsWith("39") ? d : `39${d}`;
}

export default function PartnerDashboard() {
  const { user, logout } = useAuth();
  const [me, setMe] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "partner") return;
    Promise.all([api.get("/partner/me"), api.get("/partner/assignments")])
      .then(([m, a]) => { setMe(m.data); setAssignments(a.data); })
      .catch(() => toast.error("Errore nel caricamento dei dati"))
      .finally(() => setLoading(false));
  }, [user]);

  if (user === null) {
    return <div className="min-h-screen bg-[#1C1C1E] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#F2A93B] animate-spin" /></div>;
  }
  if (!user || user.role !== "partner") return <Navigate to="/partner/login" replace />;

  const approved = me?.user?.approved;
  const premium = me?.user?.premium;

  const act = async (rid, status) => {
    try {
      await api.patch(`/partner/assignments/${rid}`, { status });
      setAssignments((as) => as.map((a) => (a.id === rid ? { ...a, assignment_status: status } : a)));
      toast.success(status === "accettata" ? "Richiesta presa in carico" : "Intervento completato. Grazie!");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  return (
    <div data-testid="partner-dashboard" className="min-h-screen bg-[#1C1C1E] text-[#F5F1EA]">
      <header className="sticky top-0 z-40 bg-[#1C1C1E]/80 backdrop-blur-xl border-b border-[#F5F1EA]/10">
        <div className="px-6 md:px-12 mx-auto max-w-5xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[#F2A93B] flex items-center justify-center"><Wrench className="w-4 h-4 text-[#1C1C1E]" strokeWidth={2.5} /></span>
            <span className="font-display font-bold">COA Partner</span>
          </div>
          <button data-testid="partner-logout-button" onClick={logout} className="inline-flex items-center gap-2 text-sm text-[#F5F1EA]/60 hover:text-[#F5F1EA] transition-colors">
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </header>

      <main className="px-6 md:px-12 mx-auto max-w-5xl py-10">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#F2A93B] animate-spin" /></div>
        ) : (
          <>
            <div data-testid="partner-status-banner" className={`border p-6 flex flex-col sm:flex-row sm:items-center gap-3 ${
              approved ? "border-[#4CAF7D]/40 bg-[#4CAF7D]/10" : "border-[#F2A93B]/40 bg-[#F2A93B]/10"
            }`}>
              {approved ? <CheckCircle2 className="w-6 h-6 text-[#4CAF7D]" /> : <Loader2 className="w-6 h-6 text-[#F2A93B]" />}
              <div className="flex-1">
                <p className="font-display font-bold text-lg">{approved ? `Partner attivo — ${me?.application?.professione || ""}` : "Candidatura in verifica"}</p>
                <p className="text-sm text-[#F5F1EA]/60 mt-1">
                  {approved
                    ? "Le richieste della tua zona e professione ti vengono assegnate automaticamente qui sotto."
                    : "La centrale operativa sta verificando la tua candidatura. Riceverai le richieste appena sarai approvato."}
                </p>
              </div>
              {premium && (
                <span data-testid="partner-premium-badge" className="inline-flex items-center gap-1.5 bg-[#F2A93B] text-[#1C1C1E] px-4 py-2 text-xs font-bold tracking-widest uppercase">
                  <Star className="w-4 h-4" fill="currentColor" /> Premium
                </span>
              )}
            </div>

            <h2 className="mt-12 mb-6 font-display text-2xl font-bold">Interventi assegnati a te</h2>
            {assignments.length === 0 ? (
              <p data-testid="assignments-empty" className="border border-[#F5F1EA]/10 p-10 text-center text-[#F5F1EA]/40">
                Nessun intervento assegnato al momento.
              </p>
            ) : (
              <div className="space-y-4">
                {assignments.map((a) => {
                  const wa = waNumber(a.telefono);
                  return (
                    <div key={a.id} data-testid={`assignment-card-${a.id}`} className="border border-[#F5F1EA]/10 bg-[#26241F] p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-xl font-bold">{a.tipo_intervento}</p>
                          <p className="font-mono-data text-xs text-[#F5F1EA]/50 mt-1">{a.indirizzo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.urgente && <span data-testid={`assignment-urgent-${a.id}`} className="text-[10px] font-bold tracking-widest uppercase text-[#F2A93B] border border-[#F2A93B]/40 bg-[#F2A93B]/10 px-2 py-1">Urgente</span>}
                          <span data-testid={`assignment-status-${a.id}`} className={`text-[10px] font-bold tracking-widest uppercase border px-2 py-1 ${ASSIGN_COLORS[a.assignment_status] || ASSIGN_COLORS.assegnata}`}>
                            {ASSIGN_LABELS[a.assignment_status] || a.assignment_status}
                          </span>
                        </div>
                      </div>
                      <p className="mt-4 text-sm text-[#F5F1EA]/70">{a.descrizione}</p>
                      <div className="mt-5 pt-5 border-t border-[#F5F1EA]/10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
                        <span className="text-[#F5F1EA]/80 font-medium">{a.nome} {a.cognome}</span>
                        <span className="font-mono-data text-xs text-[#F5F1EA]/50">{a.telefono}</span>
                        <span className="font-mono-data text-xs text-[#F5F1EA]/50">{a.email}</span>
                        {wa && (
                          <a
                            data-testid={`assignment-whatsapp-${a.id}`}
                            href={`https://wa.me/${wa}?text=${encodeURIComponent(`Buongiorno ${a.nome}, sono ${me?.user?.name || "l'artigiano"} di COA. La chiamo per l'intervento di ${a.tipo_intervento}.`)}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#25D366] border border-[#25D366]/40 bg-[#25D366]/10 px-3 py-1.5 hover:bg-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Contatta su WhatsApp
                          </a>
                        )}
                      </div>
                      {a.assignment_status !== "completata" && (
                        <div className="mt-5 flex gap-3">
                          {a.assignment_status === "assegnata" && (
                            <button data-testid={`accept-button-${a.id}`} onClick={() => act(a.id, "accettata")} className="bg-[#F2A93B] text-[#1C1C1E] px-6 py-3 text-sm font-semibold hover:bg-[#D98E1F] transition-colors">
                              Prendi in carico
                            </button>
                          )}
                          {a.assignment_status === "accettata" && (
                            <button data-testid={`complete-button-${a.id}`} onClick={() => act(a.id, "completata")} className="bg-[#4CAF7D] text-[#1C1C1E] px-6 py-3 text-sm font-semibold hover:bg-[#3d9168] transition-colors">
                              Segna come completata
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
