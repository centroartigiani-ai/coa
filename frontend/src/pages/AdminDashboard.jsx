import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, Loader2, LogOut, MessageCircle, Paperclip, Star, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, API_BASE, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const STATUS_LABELS = { nuova: "Nuova", in_lavorazione: "In lavorazione", completata: "Completata" };
const STATUS_COLORS = {
  nuova: "text-[#FF5A00] border-[#FF5A00]/40 bg-[#FF5A00]/10",
  in_lavorazione: "text-amber-300 border-amber-300/40 bg-amber-300/10",
  completata: "text-emerald-400 border-emerald-400/40 bg-emerald-400/10",
};

const fmtDate = (iso) => new Date(iso).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

function waNumber(phone) {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("39")) return digits;
  return `39${digits}`;
}

function WhatsAppButton({ phone, message, testid }) {
  const num = waNumber(phone);
  if (!num) return <span className="text-white/20 text-xs">—</span>;
  return (
    <a
      data-testid={testid}
      href={`https://wa.me/${num}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 hover:bg-emerald-400/20 transition-colors whitespace-nowrap"
    >
      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
    </a>
  );
}

function StatusSelect({ item, endpoint, onUpdate, testid }) {
  return (
    <Select value={item.status} onValueChange={async (v) => {
      try {
        await api.patch(`/${endpoint}/${item.id}`, { status: v });
        onUpdate(item.id, v);
        toast.success("Stato aggiornato");
      } catch (err) {
        toast.error(formatApiError(err.response?.data?.detail));
      }
    }}>
      <SelectTrigger data-testid={testid} className={`h-8 w-44 text-xs border rounded-none ${STATUS_COLORS[item.status]}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
        {Object.entries(STATUS_LABELS).map(([k, l]) => (
          <SelectItem key={k} value={k} className="focus:bg-[#FF5A00] focus:text-white text-xs">{l}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function AttachmentLink({ item, endpoint }) {
  if (!item.has_attachment) return <span className="text-white/20 text-xs">—</span>;
  return (
    <a data-testid={`attachment-link-${item.id}`} href={`${API_BASE}/${endpoint}/${item.id}/attachment`} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs text-[#FF5A00] hover:underline">
      <Paperclip className="w-3.5 h-3.5" /> {item.attachment_name || "Allegato"}
    </a>
  );
}

const Th = ({ children }) => <th className="text-left text-[10px] font-bold tracking-[0.2em] uppercase text-white/40 px-4 py-3 whitespace-nowrap">{children}</th>;
const Td = ({ children, className = "" }) => <td className={`px-4 py-4 text-sm text-white/70 align-top ${className}`}>{children}</td>;

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [requests, setRequests] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnersList, setPartnersList] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([api.get("/requests"), api.get("/partners"), api.get("/admin/partners-list"), api.get("/reviews")])
      .then(([r, p, pl, rv]) => { setRequests(r.data); setPartners(p.data); setPartnersList(pl.data); setReviews(rv.data); })
      .catch(() => toast.error("Errore nel caricamento dei dati"))
      .finally(() => setLoading(false));
  }, [user]);

  if (user === null) return <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center"><Loader2 className="w-8 h-8 text-[#FF5A00] animate-spin" /></div>;
  if (user === false) return <Navigate to="/admin/login" replace />;

  const updateReq = (id, status) => setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
  const updatePar = (id, status) => setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, status } : p)));

  const assignPartner = async (rid, email) => {
    try {
      await api.patch(`/requests/${rid}/assign`, { partner_email: email });
      const p = partnersList.find((x) => x.email === email);
      setRequests((rs) => rs.map((r) => (r.id === rid ? { ...r, assigned_to: email, assigned_name: p?.name || email, assignment_status: "assegnata" } : r)));
      toast.success("Richiesta assegnata");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const approvePartner = async (id) => {
    try {
      await api.patch(`/partners/${id}/approve`);
      setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, status: "approvata", approved: true } : p)));
      toast.success("Partner approvato e attivato");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const togglePremium = async (id) => {
    try {
      const { data } = await api.patch(`/partners/${id}/premium`);
      setPartners((ps) => ps.map((p) => (p.id === id ? { ...p, premium: data.premium } : p)));
      toast.success(data.premium ? "Partner impostato Premium" : "Premium rimosso");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const approveReview = async (id, approved) => {
    try {
      await api.patch(`/reviews/${id}`, { approved });
      setReviews((rs) => rs.map((r) => (r.id === id ? { ...r, approved } : r)));
      toast.success(approved ? "Recensione pubblicata" : "Recensione nascosta");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    }
  };

  const stats = [
    { label: "Richieste totali", value: requests.length, testid: "stat-requests-total" },
    { label: "Richieste nuove", value: requests.filter((r) => r.status === "nuova").length, testid: "stat-requests-new" },
    { label: "Interventi urgenti", value: requests.filter((r) => r.urgente).length, testid: "stat-urgent" },
    { label: "Candidature partner", value: partners.length, testid: "stat-partners" },
  ];

  return (
    <div data-testid="admin-dashboard" className="min-h-screen bg-[#0A0A0A] text-white">
      <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-white/10">
        <div className="px-6 md:px-12 mx-auto max-w-7xl h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-[#FF5A00] flex items-center justify-center"><Wrench className="w-4 h-4 text-black" strokeWidth={2.5} /></span>
            <span className="font-display font-bold">COA Admin</span>
          </div>
          <button data-testid="admin-logout-button" onClick={logout} className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
            <LogOut className="w-4 h-4" /> Esci
          </button>
        </div>
      </header>

      <main className="px-6 md:px-12 mx-auto max-w-7xl py-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div key={s.testid} data-testid={s.testid} className="bg-[#111111] border border-white/10 p-6">
              <p className="font-display text-3xl md:text-4xl font-black text-white">{s.value}</p>
              <p className="text-xs tracking-[0.15em] uppercase text-white/40 mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-[#FF5A00] animate-spin" /></div>
        ) : (
          <Tabs defaultValue="requests">
            <TabsList className="bg-[#111111] border border-white/10 rounded-none h-auto p-1">
              <TabsTrigger data-testid="tab-requests" value="requests" className="rounded-none data-[state=active]:bg-[#FF5A00] data-[state=active]:text-white px-6 py-2.5">Richieste ({requests.length})</TabsTrigger>
              <TabsTrigger data-testid="tab-partners" value="partners" className="rounded-none data-[state=active]:bg-[#FF5A00] data-[state=active]:text-white px-6 py-2.5">Partner ({partners.length})</TabsTrigger>
              <TabsTrigger data-testid="tab-reviews" value="reviews" className="rounded-none data-[state=active]:bg-[#FF5A00] data-[state=active]:text-white px-6 py-2.5">Recensioni ({reviews.filter((r) => !r.approved).length} da moderare)</TabsTrigger>
            </TabsList>

            <TabsContent value="requests" className="mt-6">
              <div className="border border-white/10 overflow-x-auto">
                <table data-testid="requests-table" className="w-full min-w-[900px]">
                  <thead className="bg-[#111111] border-b border-white/10">
                    <tr><Th>Data</Th><Th>Cliente</Th><Th>Contatti</Th><Th>Comune</Th><Th>Tipo</Th><Th>Urgente</Th><Th>Foto</Th><Th>WhatsApp</Th><Th>Assegnato a</Th><Th>Stato</Th></tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 && <tr><Td className="text-center text-white/30 py-10" colSpan={10}>Nessuna richiesta ricevuta</Td></tr>}
                    {requests.map((r) => (
                      <tr key={r.id} data-testid={`request-row-${r.id}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <Td className="whitespace-nowrap">{fmtDate(r.created_at)}</Td>
                        <Td><p className="text-white font-medium">{r.nome} {r.cognome}</p><p className="text-xs text-white/40 mt-1 max-w-[220px] truncate" title={r.descrizione}>{r.descrizione}</p></Td>
                        <Td><p>{r.telefono}</p><p className="text-xs text-white/40">{r.email}</p></Td>
                        <Td>{r.comune || "—"}</Td>
                        <Td>{r.tipo_intervento}</Td>
                        <Td>{r.urgente ? <span data-testid={`urgent-badge-${r.id}`} className="text-xs font-bold text-[#FF5A00] border border-[#FF5A00]/40 bg-[#FF5A00]/10 px-2 py-1">URGENTE</span> : <span className="text-white/20 text-xs">—</span>}</Td>
                        <Td><AttachmentLink item={r} endpoint="requests" /></Td>
                        <Td>
                          <WhatsAppButton
                            phone={r.telefono}
                            testid={`whatsapp-request-${r.id}`}
                            message={`Buongiorno ${r.nome}, sono COA — Centrale Operativa Artigiani. Abbiamo ricevuto la sua richiesta di "${r.tipo_intervento}". La ricontatto per organizzare l'intervento.`}
                          />
                        </Td>
                        <Td>
                          {r.assigned_to ? (
                            <div data-testid={`assigned-to-${r.id}`}>
                              <p className="text-xs font-medium text-white">{r.assigned_name || r.assigned_to}</p>
                              <p className="text-[10px] uppercase tracking-wider text-white/40 mt-0.5">{r.assignment_status}</p>
                            </div>
                          ) : (
                            <Select onValueChange={(v) => assignPartner(r.id, v)}>
                              <SelectTrigger data-testid={`assign-select-${r.id}`} className="h-8 w-44 text-xs border border-[#FF5A00]/40 text-[#FF5A00] bg-[#FF5A00]/10 rounded-none">
                                <SelectValue placeholder="Da assegnare" />
                              </SelectTrigger>
                              <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
                                {partnersList.map((p) => (
                                  <SelectItem key={p.email} value={p.email} className="focus:bg-[#FF5A00] focus:text-white text-xs">
                                    {p.name} — {p.professione}{p.premium ? " ★" : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </Td>
                        <Td><StatusSelect item={r} endpoint="requests" onUpdate={updateReq} testid={`status-select-${r.id}`} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="partners" className="mt-6">
              <div className="border border-white/10 overflow-x-auto">
                <table data-testid="partners-table" className="w-full min-w-[1000px]">
                  <thead className="bg-[#111111] border-b border-white/10">
                    <tr><Th>Data</Th><Th>Nome</Th><Th>Ragione sociale</Th><Th>Contatti</Th><Th>Professione</Th><Th>Zone</Th><Th>Esperienza</Th><Th>CV</Th><Th>WhatsApp</Th><Th>Account</Th><Th>Stato</Th></tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 && <tr><Td className="text-center text-white/30 py-10" colSpan={11}>Nessuna candidatura ricevuta</Td></tr>}
                    {partners.map((p) => (
                      <tr key={p.id} data-testid={`partner-row-${p.id}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <Td className="whitespace-nowrap">{fmtDate(p.created_at)}</Td>
                        <Td className="text-white font-medium">{p.nome} {p.cognome}</Td>
                        <Td><p>{p.ragione_sociale}</p><p className="text-xs text-white/40">P.IVA {p.partita_iva}</p></Td>
                        <Td><p>{p.telefono}</p><p className="text-xs text-white/40">{p.email}</p></Td>
                        <Td>{p.professione}</Td>
                        <Td className="max-w-[180px]">{p.zone_coperte}</Td>
                        <Td className="whitespace-nowrap">{p.anni_esperienza}</Td>
                        <Td><AttachmentLink item={p} endpoint="partners" /></Td>
                        <Td>
                          <WhatsAppButton
                            phone={p.telefono}
                            testid={`whatsapp-partner-${p.id}`}
                            message={`Buongiorno ${p.nome}, sono COA — Centrale Operativa Artigiani. Abbiamo ricevuto la sua candidatura come ${p.professione}. La ricontatto per i prossimi passi.`}
                          />
                        </Td>
                        <Td>
                          {p.approved ? (
                            <div className="flex flex-col gap-2 items-start">
                              <span data-testid={`partner-active-${p.id}`} className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 border border-emerald-400/40 bg-emerald-400/10 px-2 py-1">Attivo</span>
                              <button
                                data-testid={`premium-toggle-${p.id}`}
                                onClick={() => togglePremium(p.id)}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 border transition-colors ${
                                  p.premium ? "text-amber-300 border-amber-300/50 bg-amber-300/10" : "text-white/50 border-white/20 hover:border-amber-300/50 hover:text-amber-300"
                                }`}
                              >
                                <Star className="w-3.5 h-3.5" fill={p.premium ? "currentColor" : "none"} /> {p.premium ? "Premium" : "Rendi Premium"}
                              </button>
                            </div>
                          ) : (
                            <button
                              data-testid={`approve-partner-${p.id}`}
                              onClick={() => approvePartner(p.id)}
                              className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FF5A00] text-white px-3 py-2 hover:bg-[#E04F00] transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" /> Approva
                            </button>
                          )}
                        </Td>
                        <Td><StatusSelect item={p} endpoint="partners" onUpdate={updatePar} testid={`status-select-${p.id}`} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-6">
              <div className="border border-white/10 overflow-x-auto">
                <table data-testid="reviews-table" className="w-full min-w-[800px]">
                  <thead className="bg-[#111111] border-b border-white/10">
                    <tr><Th>Data</Th><Th>Cliente</Th><Th>Servizio</Th><Th>Voto</Th><Th>Recensione</Th><Th>Stato</Th></tr>
                  </thead>
                  <tbody>
                    {reviews.length === 0 && <tr><Td className="text-center text-white/30 py-10" colSpan={6}>Nessuna recensione ricevuta</Td></tr>}
                    {reviews.map((rv) => (
                      <tr key={rv.id} data-testid={`review-row-${rv.id}`} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <Td className="whitespace-nowrap">{fmtDate(rv.created_at)}</Td>
                        <Td className="text-white font-medium">{rv.nome}</Td>
                        <Td>{rv.tipo_intervento}</Td>
                        <Td><span data-testid={`review-rating-${rv.id}`} className="text-[#FF5A00] tracking-wider">{"★".repeat(rv.rating)}{"☆".repeat(5 - rv.rating)}</span></Td>
                        <Td className="max-w-[320px]"><p className="text-white/70">{rv.text}</p></Td>
                        <Td>
                          {rv.approved ? (
                            <div className="flex flex-col gap-2 items-start">
                              <span data-testid={`review-published-${rv.id}`} className="text-[10px] font-bold tracking-widest uppercase text-emerald-400 border border-emerald-400/40 bg-emerald-400/10 px-2 py-1">Pubblicata</span>
                              <button data-testid={`review-hide-${rv.id}`} onClick={() => approveReview(rv.id, false)} className="text-xs text-white/50 border border-white/20 px-2.5 py-1 hover:border-white hover:text-white transition-colors">Nascondi</button>
                            </div>
                          ) : (
                            <button data-testid={`review-approve-${rv.id}`} onClick={() => approveReview(rv.id, true)} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-[#FF5A00] text-white px-3 py-2 hover:bg-[#E04F00] transition-colors">
                              <Check className="w-3.5 h-3.5" /> Approva
                            </button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
