import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock, Star } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api, formatApiError } from "@/lib/api";

const FASCE = [
  { k: "mattina", short: "M", title: "Mattina (8–13)" },
  { k: "pomeriggio", short: "P", title: "Pomeriggio (13–18)" },
];
const DAY_NAMES = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
const MAX_WEEK_OFFSET = 2;

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const mondayOf = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7) + offset * 7);
  return d;
};
const fmtDay = (d) => d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });

const CELL_STYLES = {
  libero: "border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/15 cursor-pointer",
  occupato: "border-[#FF5A00]/60 bg-[#FF5A00]/10 text-[#FF5A00] cursor-default",
  assegnato: "border-white/60 bg-white/10 text-white hover:bg-white/20 cursor-pointer",
  passato: "border-white/5 text-white/20 cursor-default",
};

export function AdminCalendar({ requests, onOpenRequest, onAssigned }) {
  const [week, setWeek] = useState(0);
  const [data, setData] = useState({ partners: [], slots: [] });
  const [loading, setLoading] = useState(true);
  const [fProf, setFProf] = useState("tutte");
  const [fZona, setFZona] = useState("tutte");
  const [shortcut, setShortcut] = useState(null); // {partner, date, fascia}
  const [assigningId, setAssigningId] = useState("");

  const days = useMemo(() => Array.from({ length: 6 }, (_, i) => {
    const d = new Date(mondayOf(week));
    d.setDate(d.getDate() + i);
    return d;
  }), [week]);
  const todayIso = iso(new Date());

  const load = () => {
    setLoading(true);
    api.get(`/admin/calendar?start=${iso(mondayOf(week))}`)
      .then(({ data: d }) => setData(d && Array.isArray(d.partners) ? d : { partners: [], slots: [] }))
      .catch(() => toast.error("Errore nel caricamento del calendario"))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    let ignore = false;
    setLoading(true);
    api.get(`/admin/calendar?start=${iso(mondayOf(week))}`)
      .then(({ data: d }) => { if (!ignore) setData(d && Array.isArray(d.partners) ? d : { partners: [], slots: [] }); })
      .catch(() => { if (!ignore) toast.error("Errore nel caricamento del calendario"); })
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [week]);

  const slotMap = useMemo(() => {
    const m = {};
    (data.slots || []).forEach((s) => { m[`${s.partner_email}|${s.date}|${s.fascia}`] = s; });
    return m;
  }, [data]);

  const professioni = useMemo(() => [...new Set(data.partners.map((p) => p.professione).filter(Boolean))].sort(), [data]);
  const zone = useMemo(() => {
    const seen = new Map();
    data.partners.forEach((p) => {
      (p.zone_coperte || "").split(",").forEach((z) => {
        const t = z.trim();
        if (t && !seen.has(t.toLowerCase())) seen.set(t.toLowerCase(), t);
      });
    });
    return [...seen.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  }, [data]);

  const visible = data.partners.filter((p) => {
    if (fProf !== "tutte" && p.professione !== fProf) return false;
    if (fZona !== "tutte" && !(p.zone_coperte || "").toLowerCase().split(",").map((z) => z.trim()).includes(fZona.toLowerCase())) return false;
    return true;
  });

  const unassigned = (requests || []).filter((r) => !r.assigned_to && r.status !== "completata");

  const pickRequest = async (rid) => {
    if (!shortcut) return;
    setAssigningId(rid);
    try {
      await api.patch(`/requests/${rid}/assign`, { partner_email: shortcut.partner.email, date: shortcut.date, fascia: shortcut.fascia });
      toast.success(`Assegnato a ${shortcut.partner.name}: ${fmtDay(new Date(`${shortcut.date}T00:00:00`))} — ${FASCE.find((f) => f.k === shortcut.fascia)?.title}`);
      onAssigned?.(rid, { assigned_to: shortcut.partner.email, assigned_name: shortcut.partner.name, assignment_status: "assegnata", assigned_date: shortcut.date, assigned_fascia: shortcut.fascia });
      setShortcut(null);
      load();
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setAssigningId("");
    }
  };

  return (
    <div data-testid="admin-calendar" className="border border-white/10 bg-[#111111] p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <button data-testid="admin-cal-week-prev" onClick={() => setWeek((w) => Math.max(0, w - 1))} disabled={week === 0}
            className="p-2 border border-white/20 text-white/70 hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span data-testid="admin-cal-week-label" className="px-3 text-xs font-medium text-white/60 whitespace-nowrap">{fmtDay(days[0])} — {fmtDay(days[5])}</span>
          <button data-testid="admin-cal-week-next" onClick={() => setWeek((w) => Math.min(MAX_WEEK_OFFSET, w + 1))} disabled={week === MAX_WEEK_OFFSET}
            className="p-2 border border-white/20 text-white/70 hover:border-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Select value={fProf} onValueChange={setFProf}>
            <SelectTrigger data-testid="admin-cal-filter-professione" className="h-8 w-48 text-xs border-white/20 bg-transparent rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
              <SelectItem value="tutte" className="focus:bg-[#FF5A00] focus:text-white text-xs">Tutte le professioni</SelectItem>
              {professioni.map((p) => <SelectItem key={p} value={p} className="focus:bg-[#FF5A00] focus:text-white text-xs">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={fZona} onValueChange={setFZona}>
            <SelectTrigger data-testid="admin-cal-filter-zona" className="h-8 w-44 text-xs border-white/20 bg-transparent rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1A1A1A] border-white/10 text-white">
              <SelectItem value="tutte" className="focus:bg-[#FF5A00] focus:text-white text-xs">Tutte le zone</SelectItem>
              {zone.map((z) => <SelectItem key={z} value={z} className="focus:bg-[#FF5A00] focus:text-white text-xs">{z}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 text-[#FF5A00] animate-spin" /></div>
      ) : visible.length === 0 ? (
        <p data-testid="admin-cal-empty" className="py-16 text-center text-white/30 text-sm">Nessun operatore attivo con questi filtri.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[1100px]">
            <div className="grid grid-cols-[180px_repeat(6,1fr)] gap-px bg-white/5 border border-white/10">
              <div className="bg-[#111111] p-2" />
              {days.map((d) => (
                <div key={iso(d)} className={`bg-[#111111] p-2 text-center ${iso(d) === todayIso ? "text-[#FF5A00]" : "text-white/60"}`}>
                  <p className="text-[10px] font-bold tracking-widest uppercase">{DAY_NAMES[days.indexOf(d)]}</p>
                  <p className="text-[10px]">{fmtDay(d)}</p>
                  <p className="text-[9px] text-white/30 tracking-widest">M · P</p>
                </div>
              ))}
              {visible.map((p) => (
                <div key={p.email} className="contents">
                  <div className="bg-[#111111] p-2 flex flex-col justify-center border-t border-white/5">
                    <p className="text-xs font-medium text-white flex items-center gap-1.5">
                      {p.premium && <Star className="w-3 h-3 text-amber-300" fill="currentColor" />}
                      <span className="truncate">{p.name}</span>
                    </p>
                    <p className="text-[10px] text-white/40 truncate">{p.professione}</p>
                  </div>
                  {days.map((d) => {
                    const dIso = iso(d);
                    const past = dIso < todayIso;
                    return (
                      <div key={dIso} className="bg-[#111111] grid grid-cols-2 gap-px border-t border-white/5">
                        {FASCE.map((f) => {
                          const s = slotMap[`${p.email}|${dIso}|${f.k}`];
                          const status = past ? "passato" : (s?.status || "libero");
                          const label = past ? "—" : status === "libero" ? f.short : status === "occupato" ? "Occ." : null;
                          const tip = `${p.name} — ${DAY_NAMES[days.indexOf(d)]} ${fmtDay(d)} ${f.title}: ${status}${s?.cliente ? ` — ${s.cliente}` : ""}`;
                          return (
                            <button
                              key={f.k}
                              type="button"
                              data-testid={`admin-cal-cell-${p.email}-${dIso}-${f.k}`}
                              data-status={status}
                              title={tip}
                              disabled={past || status === "occupato"}
                              onClick={() => {
                                if (status === "assegnato" && s?.request_id) onOpenRequest?.(s.request_id);
                                else if (status === "libero") setShortcut({ partner: p, date: dIso, fascia: f.k });
                              }}
                              className={`min-h-[44px] px-1 py-1.5 border text-[10px] font-medium transition-colors flex items-center justify-center text-center leading-tight ${CELL_STYLES[status]}`}
                            >
                              {status === "assegnato" ? (
                                <span className="inline-flex items-center gap-1"><Lock className="w-2.5 h-2.5 shrink-0" /><span className="truncate max-w-[70px]">{s?.cliente || "Assegnato"}</span></span>
                              ) : label}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase tracking-widest text-white/40">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-emerald-400/60" /> Libero (clicca per assegnare)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#FF5A00]/30 border border-[#FF5A00]/60" /> Occupato (privato)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-white/20 border border-white/60" /> Assegnato (clicca per dettaglio)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-white/10" /> Passato</span>
          </div>
        </div>
      )}

      <Dialog open={!!shortcut} onOpenChange={() => setShortcut(null)}>
        <DialogContent data-testid="cal-shortcut-dialog" data-lenis-prevent className="bg-[#111111] border-white/10 text-white max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-none">
          {shortcut && (
            <>
              <DialogHeader>
                <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00]">Assegnazione rapida</p>
                <DialogTitle className="font-display text-xl font-bold text-white">
                  {shortcut.partner.name} — {fmtDay(new Date(`${shortcut.date}T00:00:00`))}, {FASCE.find((f) => f.k === shortcut.fascia)?.title}
                </DialogTitle>
                <DialogDescription className="text-white/50">Scegli la richiesta da assegnare a questo slot.</DialogDescription>
              </DialogHeader>
              {unassigned.length === 0 ? (
                <p data-testid="cal-shortcut-empty" className="py-8 text-center text-white/40 text-sm">Nessuna richiesta in attesa di assegnazione.</p>
              ) : (
                <div className="mt-2 divide-y divide-white/5 border border-white/10">
                  {unassigned.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      data-testid={`cal-shortcut-request-${r.id}`}
                      disabled={assigningId === r.id}
                      onClick={() => pickRequest(r.id)}
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors disabled:opacity-50 flex items-center justify-between gap-3"
                    >
                      <span>
                        <span className="block text-sm text-white font-medium">{r.nome} {r.cognome} — {r.tipo_intervento}{r.urgente ? " · URGENTE" : ""}</span>
                        <span className="block text-xs text-white/40 mt-0.5">{r.indirizzo}{(r.data_preferita || r.fascia_oraria) ? ` · Preferenza: ${r.data_preferita ? fmtDay(new Date(`${r.data_preferita}T00:00:00`)) : "—"} ${r.fascia_oraria || ""}` : ""}</span>
                      </span>
                      {assigningId === r.id && <Loader2 className="w-4 h-4 text-[#FF5A00] animate-spin shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
