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

function TradesPanel() {
  return (
    <div data-testid="hero-trades-panel" className="border border-[#F5F1EA]/15 bg-[#26241F]/70 backdrop-blur-sm">
      <div className="grid grid-cols-2 divide-x divide-[#F5F1EA]/10">
        <div className="p-8 md:p-10 flex flex-col items-center gap-4">
          <IconPlumber className="w-16 h-16 md:w-20 md:h-20 text-[#F2A93B]" />
          <span className="font-mono-data text-xs tracking-[0.3em] uppercase text-[#F5F1EA]/70">Acqua</span>
        </div>
        <div className="p-8 md:p-10 flex flex-col items-center gap-4">
          <IconElectrician className="w-16 h-16 md:w-20 md:h-20 text-[#F2A93B]" />
          <span className="font-mono-data text-xs tracking-[0.3em] uppercase text-[#F5F1EA]/70">Corrente</span>
        </div>
      </div>
      <p className="border-t border-[#F5F1EA]/10 px-6 py-4 text-center font-mono-data text-[10px] tracking-[0.25em] uppercase text-[#F5F1EA]/40">
        Centrale operativa — Varese e provincia
      </p>
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
        <img src={HERO_IMG} alt="Artigiano al lavoro durante un pronto intervento a Varese" className="w-full h-full object-cover" />
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

          <h1 className="font-display font-bold tracking-tight leading-[1.05] text-[#F5F1EA] text-4xl sm:text-5xl lg:text-6xl">
            <MaskedLine delay={0.35}>Idraulico o elettricista</MaskedLine>
            <MaskedLine delay={0.5}>a Varese?</MaskedLine>
            <MaskedLine delay={0.65}>
              <span className="text-[#F2A93B]">Ti mettiamo in contatto in fretta.</span>
            </MaskedLine>
          </h1>

          <MaskedLine delay={0.85}>
            <p data-testid="hero-subtitle" className="mt-8 max-w-xl text-base md:text-lg text-[#F5F1EA]/70">
              COA mette in contatto privati, condomini e aziende con artigiani qualificati per pronto intervento idraulico ed elettrico, riparazioni domestiche e manutenzioni. Rapidi, affidabili e verificati.
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
              className="group bg-[#F2A93B] text-[#1C1C1E] px-10 py-5 text-lg font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#D98E1F] transition-colors shadow-[0_0_50px_rgba(242,169,59,0.3)]"
            >
              Richiedi un intervento
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              data-testid="hero-partner-cta"
              onClick={onPartner}
              className="group bg-transparent border border-[#F5F1EA]/25 text-[#F5F1EA] px-8 py-5 font-medium inline-flex items-center justify-center gap-2 hover:border-[#F5F1EA] transition-colors"
            >
              Diventa partner
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-5"
        >
          <TradesPanel />
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
