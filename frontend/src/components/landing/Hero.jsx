import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { MaskedLine } from "@/components/Reveal";

const HERO_IMG = "https://images.pexels.com/photos/1555177/pexels-photo-1555177.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const STATS = [
  { value: "15 min", label: "Tempo medio di ricontatto" },
  { value: "100%", label: "Artigiani selezionati e verificati" },
  { value: "1 solo", label: "Punto di contatto per tutto" },
];

export default function Hero({ onRequest, onPartner }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const fade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <section ref={ref} data-testid="hero-section" className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      <motion.div style={{ y: bgY }} className="absolute inset-0 scale-110">
        <img src={HERO_IMG} alt="Artigiano al lavoro" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
      </motion.div>

      <motion.div style={{ opacity: fade }} className="relative z-10 px-6 md:px-12 mx-auto max-w-7xl w-full pt-40 pb-16">
        <MaskedLine delay={0.2}>
          <p data-testid="hero-overline" className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00] mb-8 flex items-center gap-3">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF5A00] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF5A00]" />
            </span>
            Centrale Operativa Artigiani — Provincia di Varese
          </p>
        </MaskedLine>

        <h1 className="font-display font-black uppercase tracking-tighter leading-[0.92] text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl">
          <MaskedLine delay={0.35}>Trova l'artigiano</MaskedLine>
          <MaskedLine delay={0.5}>giusto in meno</MaskedLine>
          <MaskedLine delay={0.65}>
            di <span className="text-[#FF5A00]">15 minuti.</span>
          </MaskedLine>
        </h1>

        <MaskedLine delay={0.9}>
          <p data-testid="hero-subtitle" className="mt-8 max-w-xl text-base md:text-lg text-white/70">
            COA mette in contatto privati, condomini e aziende con artigiani qualificati per interventi rapidi, affidabili e verificati.
          </p>
        </MaskedLine>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <button
            data-testid="hero-request-cta"
            onClick={onRequest}
            className="group relative overflow-hidden bg-[#FF5A00] text-white px-8 py-4 font-medium inline-flex items-center justify-center gap-2 hover:bg-[#E04F00] transition-colors"
          >
            Richiedi un intervento
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <button
            data-testid="hero-partner-cta"
            onClick={onPartner}
            className="group bg-transparent border border-white/20 text-white px-8 py-4 font-medium inline-flex items-center justify-center gap-2 hover:border-white transition-colors"
          >
            Diventa partner
            <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 1 }}
          className="mt-20 grid grid-cols-1 sm:grid-cols-3 border-t border-white/10"
        >
          {STATS.map((s, i) => (
            <div key={i} data-testid={`hero-stat-${i}`} className="py-6 sm:pr-8 sm:border-r border-white/10 last:border-r-0">
              <p className="font-display text-3xl md:text-4xl font-black text-white">{s.value}</p>
              <p className="text-sm text-white/50 mt-1">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
