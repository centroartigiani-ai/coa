import Marquee from "react-fast-marquee";
import { MapPin, Asterisk } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const ACTIVE = ["Provincia di Varese"];
const COMING = ["Como", "Novara", "Gallarate", "Busto Arsizio"];
const MARQUEE_ITEMS = ["Varese", "Como", "Novara", "Gallarate", "Busto Arsizio"];

export default function Areas() {
  return (
    <section id="aree" data-testid="areas-section" className="py-24 md:py-32 bg-[#111111] border-y border-white/10 overflow-hidden">
      <Marquee speed={35} gradient={false} data-testid="areas-marquee" className="mb-16">
        {MARQUEE_ITEMS.map((city, i) => (
          <span key={i} className="flex items-center shrink-0">
            <span className={`font-display text-6xl md:text-8xl font-black uppercase tracking-tighter mx-6 ${i % 2 === 0 ? "text-white" : "text-outline"}`}>
              {city}
            </span>
            <Asterisk className="w-8 h-8 text-[#FF5A00]" strokeWidth={1.5} />
          </span>
        ))}
      </Marquee>

      <div className="px-6 md:px-12 mx-auto max-w-7xl">
        <Reveal>
          <p data-testid="section-label-06" className="text-xs font-bold tracking-[0.3em] uppercase text-[#FF5A00] mb-6 flex items-center gap-3">
            <span className="inline-block w-10 h-px bg-[#FF5A00]" />
            06 — Aree coperte
          </p>
        </Reveal>
        <div className="flex flex-col md:flex-row md:items-end gap-10 justify-between">
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-xl leading-[1.05]">
              Operativi a Varese. <span className="text-white/40">In arrivo ovunque.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="flex flex-wrap gap-3">
              {ACTIVE.map((a) => (
                <span key={a} data-testid="area-active-varese" className="inline-flex items-center gap-2 bg-[#FF5A00] text-white px-5 py-2.5 text-sm font-medium">
                  <MapPin className="w-4 h-4" strokeWidth={2} /> {a}
                </span>
              ))}
              {COMING.map((c, i) => (
                <span key={c} data-testid={`area-coming-${i}`} className="inline-flex items-center gap-2 border border-white/15 text-white/50 px-5 py-2.5 text-sm">
                  {c} <span className="text-[10px] uppercase tracking-widest text-[#FF5A00]">presto</span>
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
