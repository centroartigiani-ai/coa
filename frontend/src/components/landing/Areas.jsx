import { MapPin } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const TOWNS = ["Varese", "Busto Arsizio", "Gallarate", "Saronno", "Cunardo", "Luino", "Tradate", "Cassano Magnago"];

export default function Areas() {
  return (
    <section id="aree" data-testid="areas-section" className="py-24 md:py-32 bg-[#26241F] border-y border-[#F5F1EA]/10">
      <div className="px-6 md:px-12 mx-auto max-w-7xl">
        <Reveal>
          <p data-testid="section-label-06" className="font-mono-data text-xs tracking-[0.3em] uppercase text-[#F2A93B] mb-6 flex items-center gap-3">
            <span className="inline-block w-10 h-px bg-[#F2A93B]" />
            06 — Zone servite
          </p>
        </Reveal>
        <div className="flex flex-col lg:flex-row lg:items-end gap-10 justify-between">
          <Reveal delay={0.1}>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F5F1EA] max-w-xl leading-[1.05]">
              Operativi a <span className="text-[#F2A93B]">Varese e provincia.</span>
            </h2>
            <p className="mt-6 text-[#F5F1EA]/55 max-w-lg leading-relaxed">
              Siamo nati qui e conosciamo il territorio: idraulico a Busto Arsizio, elettricista a Gallarate, manutenzioni a Saronno — ovunque in provincia, con artigiani di zona.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div data-testid="areas-towns" className="flex flex-wrap gap-2.5 max-w-md">
              {TOWNS.map((t) => (
                <span key={t} data-testid={`town-${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`} className="inline-flex items-center gap-1.5 border border-[#F5F1EA]/15 px-4 py-2 font-mono-data text-xs tracking-wider text-[#F5F1EA]/70">
                  <MapPin className="w-3.5 h-3.5 text-[#F2A93B]" strokeWidth={2} /> {t}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
