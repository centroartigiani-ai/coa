import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";

const FASCE = [
  { k: "mattina", label: "Mattina", hours: "8–13" },
  { k: "pomeriggio", label: "Pomeriggio", hours: "13–18" },
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
  libero: "border-[#4CAF7D]/40 text-[#4CAF7D] hover:bg-[#4CAF7D]/10 cursor-pointer",
  occupato: "border-[#F2A93B] bg-[#F2A93B]/15 text-[#F2A93B] hover:bg-[#F2A93B]/25 cursor-pointer",
  assegnato: "border-[#F5F1EA]/70 bg-[#F5F1EA]/15 text-[#F5F1EA] font-semibold cursor-not-allowed",
  passato: "border-[#F5F1EA]/10 text-[#F5F1EA]/25 cursor-not-allowed",
};
const CELL_LABELS = { libero: "Libero", occupato: "Occupato", assegnato: "Assegnato", passato: "—" };

export function AvailabilityCalendar({ refreshKey = 0 }) {
  const [week, setWeek] = useState(0);
  const [slots, setSlots] = useState({});
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState("");

  const monday = mondayOf(week);
  const days = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
  const todayIso = iso(new Date());

  useEffect(() => {
    setLoading(true);
    api.get(`/partner/availability?start=${iso(mondayOf(week))}`)
      .then(({ data }) => {
        const map = {};
        data.forEach((s) => { map[`${s.date}|${s.fascia}`] = s.status; });
        setSlots(map);
      })
      .catch(() => toast.error("Errore nel caricamento del calendario"))
      .finally(() => setLoading(false));
  }, [week, refreshKey]);

  const toggle = async (date, fascia) => {
    const key = `${date}|${fascia}`;
    if (slots[key] === "assegnato") return;
    const occupied = slots[key] !== "occupato";
    setToggling(key);
    try {
      await api.patch("/partner/availability", { date, fascia, occupied });
      setSlots((s) => {
        const next = { ...s };
        if (occupied) next[key] = "occupato";
        else delete next[key];
        return next;
      });
      toast.success(occupied ? "Slot segnato come occupato" : "Slot liberato");
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail));
    } finally {
      setToggling("");
    }
  };

  return (
    <div data-testid="availability-calendar" className="mt-8 border border-[#F5F1EA]/10 bg-[#26241F] p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display font-bold">Calendario disponibilità</p>
        <div className="flex items-center gap-1">
          <button
            data-testid="calendar-week-prev"
            onClick={() => setWeek((w) => Math.max(0, w - 1))}
            disabled={week === 0}
            className="p-2 border border-[#F5F1EA]/20 text-[#F5F1EA]/70 hover:border-[#F5F1EA]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span data-testid="calendar-week-label" className="px-3 text-xs font-mono-data text-[#F5F1EA]/60 whitespace-nowrap">
            {fmtDay(days[0])} — {fmtDay(days[5])}
          </span>
          <button
            data-testid="calendar-week-next"
            onClick={() => setWeek((w) => Math.min(MAX_WEEK_OFFSET, w + 1))}
            disabled={week === MAX_WEEK_OFFSET}
            className="p-2 border border-[#F5F1EA]/20 text-[#F5F1EA]/70 hover:border-[#F5F1EA]/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-[#F5F1EA]/45">Tocca una cella per segnare un impegno privato (Occupato) o liberarlo. Gli slot Assegnati sono gestiti dalla centrale operativa.</p>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 text-[#F2A93B] animate-spin" /></div>
      ) : (
        <div className="mt-4">
          <div className="grid grid-cols-[64px_1fr_1fr] sm:grid-cols-[90px_1fr_1fr] gap-2 mb-2">
            <span />
            {FASCE.map((f) => (
              <p key={f.k} className="text-center text-[10px] font-bold tracking-widest uppercase text-[#F5F1EA]/40">
                {f.label} <span className="font-mono-data normal-case">{f.hours}</span>
              </p>
            ))}
          </div>
          {days.map((d) => {
            const dIso = iso(d);
            const past = dIso < todayIso;
            return (
              <div key={dIso} className="grid grid-cols-[64px_1fr_1fr] sm:grid-cols-[90px_1fr_1fr] gap-2 mb-2 items-stretch">
                <div className={`flex flex-col justify-center ${dIso === todayIso ? "text-[#F2A93B]" : "text-[#F5F1EA]/60"}`}>
                  <p className="text-[10px] font-bold tracking-widest uppercase">{DAY_NAMES[days.indexOf(d)]}</p>
                  <p className="text-xs font-mono-data">{fmtDay(d)}</p>
                </div>
                {FASCE.map((f) => {
                  const status = past ? "passato" : (slots[`${dIso}|${f.k}`] || "libero");
                  const busy = toggling === `${dIso}|${f.k}`;
                  return (
                    <button
                      key={f.k}
                      type="button"
                      data-testid={`slot-${dIso}-${f.k}`}
                      data-status={status}
                      disabled={past || status === "assegnato" || busy}
                      onClick={() => toggle(dIso, f.k)}
                      className={`px-2 py-3 border text-xs font-medium transition-colors inline-flex items-center justify-center gap-1.5 ${CELL_STYLES[status]}`}
                    >
                      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : status === "assegnato" && <Lock className="w-3 h-3" />}
                      {CELL_LABELS[status]}
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[10px] uppercase tracking-widest text-[#F5F1EA]/40">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 border border-[#4CAF7D]/60" /> Libero</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#F2A93B]/40 border border-[#F2A93B]" /> Occupato (privato)</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#F5F1EA]/25 border border-[#F5F1EA]/50" /> Assegnato COA</span>
          </div>
        </div>
      )}
    </div>
  );
}
