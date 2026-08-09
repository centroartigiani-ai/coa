import Marquee from "react-fast-marquee";
import { MapPin, Asterisk } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const MARQUEE_ITEMS = ["Varese", "e Provincia", "Varese", "e Provincia"];

export default function Areas() {
  return (
    <section id="aree" data-testid="areas-section" className="py-24 md:py-32 bg-[#26241F] border-y border-white/10 overflow-hidden">
      <Marquee speed={25} gradient={false} data-testid="areas-marquee" className="mb-16">
        {MARQUEE_ITEMS.map((t, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className={`font-display text-6xl md:text-8xl font-black uppercase tracking-tighter mx-6 ${i % 2 === 0 ? "text-white" : "text-outline"}`}>
              {t}
            </span>
            <Asterisk className="w-8 h-8 text-[#F2A93B]" strokeWidth={1.5} />
          </span>
        ))}
      </Marquee>

      <div className="px-6 md:px-12 mx-auto max-w-7xl">
        <Reveal>
          <p data-testid="section-label-06" className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B] mb-6 flex items-center gap-3">
            <span className="inline-block w-10 h-px bg-[#F2A93B]" />
            06 — Aree coperte
          </p>
        </Reveal>
        <div className="flex flex-col md:flex-row md:items-end gap-10 justify-between">
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-xl leading-[1.05]">
              Operativi a <span className="text-[#F2A93B]">Varese e provincia.</span>
            </h2>
            <p className="mt-6 text-white/50 max-w-md">Siamo nati qui e conosciamo il territorio: copertura capillare di Varese e di tutti i comuni della provincia.</p>
          </Reveal>
          <Reveal delay={0.2}>
            <span data-testid="area-active-varese" className="inline-flex items-center gap-2 bg-[#F2A93B] text-[#1C1C1E] px-5 py-2.5 text-sm font-medium">
              <MapPin className="w-4 h-4" strokeWidth={2} /> Varese e Provincia
            </span>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
