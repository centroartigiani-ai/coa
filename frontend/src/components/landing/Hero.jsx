import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { MaskedLine } from "@/components/Reveal";
import { IconElectrician, IconPlumber } from "@/components/landing/icons";

const HERO_IMG = "https://images.pexels.com/photos/1555177/pexels-photo-1555177.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const STATS = [
  { value: "100%", label: "Artigiani selezionati e verificati" },
  { value: "1 solo", label: "Punto di contatto per tutto" },
  { value: "Zero", label: "Ricerca infinita online" },
];

function ResponseDial() {
  return (
    <div data-testid="hero-response-dial" className="relative w-52 h-52 md:w-64 md:h-64 lg:w-72 lg:h-72">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <circle cx="100" cy="100" r="97" fill="rgba(38,36,31,0.65)" stroke="rgba(245,241,234,0.12)" />
        {Array.from({ length: 60 }).map((_, i) => {
          const a = (i / 60) * Math.PI * 2;
          const major = i % 5 === 0;
          const r1 = major ? 86 : 91;
          return (
            <line
              key={i}
              x1={100 + r1 * Math.sin(a)} y1={100 - r1 * Math.cos(a)}
              x2={100 + 96 * Math.sin(a)} y2={100 - 96 * Math.cos(a)}
              stroke={major ? "rgba(245,241,234,0.35)" : "rgba(245,241,234,0.12)"}
              strokeWidth={major ? 2 : 1}
            />
          );
        })}
        <path d="M 100 3 A 97 97 0 0 1 197 100" fill="none" stroke="#F2A93B" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <motion.div className="absolute inset-0" animate={{ rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: "linear" }}>
        <div className="absolute left-1/2 top-1/2 w-[3px] h-[38%] bg-[#F2A93B] origin-bottom -translate-x-1/2 -translate-y-full rounded-full" />
      </motion.div>
      <div className="absolute left-1/2 top-1/2 w-3 h-3 bg-[#F2A93B] rounded-full -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono-data text-6xl md:text-7xl font-semibold text-[#F2A93B] leading-none mt-4">15</span>
        <span className="font-mono-data text-[10px] md:text-xs tracking-[0.3em] uppercase text-[#F5F1EA]/60 mt-2">min di risposta</span>
      </div>
    </div>
  );
}

export default function Hero({ onRequest, onPartner }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);

  return (
    <section ref={ref} data-testid="hero-section" className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img src={HERO_IMG} alt="Artigiano al lavoro" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-[#1C1C1E]/70" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#1C1C1E] to-transparent" />
      </motion.div>

      <div className="relative z-10 px-6 md:px-12 mx-auto max-w-7xl w-full pt-32 pb-16 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7">
          <MaskedLine delay={0.2}>
            <p data-testid="hero-overline" className="font-mono-data text-xs tracking-[0.3em] uppercase text-[#F2A93B] mb-8 flex items-center gap-3">
              <span className="inline-block w-8 h-px bg-[#F2A93B]" />
              Centrale Operativa Artigiani — Varese e provincia
            </p>
          </MaskedLine>

          <h1 className="font-display font-bold uppercase tracking-tight leading-[0.95] text-[#F5F1EA] text-5xl sm:text-6xl md:text-7xl">
            <MaskedLine delay={0.35}>Trova l'artigiano</MaskedLine>
            <MaskedLine delay={0.5}>giusto,</MaskedLine>
            <MaskedLine delay={0.65}>
              <span className="text-[#F2A93B]">al primo colpo.</span>
            </MaskedLine>
          </h1>

          <MaskedLine delay={0.85}>
            <p data-testid="hero-subtitle" className="mt-8 max-w-xl text-base md:text-lg text-[#F5F1EA]/70">
              COA mette in contatto privati, condomini e aziende con artigiani qualificati per interventi rapidi, affidabili e verificati.
            </p>
          </MaskedLine>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.05, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <button
              data-testid="hero-request-cta"
              onClick={onRequest}
              className="group bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#D98E1F] transition-colors"
            >
              Richiedi un intervento
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              data-testid="hero-partner-cta"
              onClick={onPartner}
              className="group bg-transparent border border-[#F5F1EA]/25 text-[#F5F1EA] px-8 py-4 font-medium inline-flex items-center justify-center gap-2 hover:border-[#F5F1EA] transition-colors"
            >
              Diventa partner
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.25, duration: 0.8 }}
            className="mt-10 flex flex-wrap gap-3"
          >
            <span data-testid="hero-chip-elettricista" className="inline-flex items-center gap-2.5 border border-[#F5F1EA]/15 bg-[#1C1C1E]/60 backdrop-blur px-4 py-2.5 font-mono-data text-xs tracking-[0.2em] uppercase text-[#F5F1EA]/75">
              <IconElectrician className="w-4 h-4 text-[#F2A93B]" /> Elettricista
            </span>
            <span data-testid="hero-chip-idraulico" className="inline-flex items-center gap-2.5 border border-[#F5F1EA]/15 bg-[#1C1C1E]/60 backdrop-blur px-4 py-2.5 font-mono-data text-xs tracking-[0.2em] uppercase text-[#F5F1EA]/75">
              <IconPlumber className="w-4 h-4 text-[#F2A93B]" /> Idraulico
            </span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5 flex flex-col items-center gap-6"
        >
          <ResponseDial />
          <p className="font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#F5F1EA]/40 text-center max-w-[220px]">
            Tempo massimo di ricontatto dopo la tua richiesta
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="relative z-10 px-6 md:px-12 mx-auto max-w-7xl w-full"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-[#F5F1EA]/10">
          {STATS.map((s, i) => (
            <div key={i} data-testid={`hero-stat-${i}`} className="py-6 sm:pr-8 sm:border-r border-[#F5F1EA]/10 last:border-r-0">
              <p className="font-mono-data text-2xl md:text-3xl font-semibold text-[#F2A93B]">{s.value}</p>
              <p className="text-sm text-[#F5F1EA]/50 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
