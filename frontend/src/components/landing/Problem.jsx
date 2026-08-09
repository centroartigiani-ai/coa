import { X, Check } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";

const PAINS = ["Tempi di risposta lunghi", "Numeri irraggiungibili", "Poca trasparenza", "Nessuna garanzia sulla qualità"];
const BENEFITS = [
  "Artigiani selezionati",
  "Risposta rapida",
  "Un unico punto di contatto",
  "Professionisti verificati",
  "Copertura locale",
  "Nessuna ricerca infinita online",
];

export default function Problem() {
  return (
    <section data-testid="problem-section" className="py-24 md:py-32 bg-[#26241F] border-y border-white/10">
      <div className="px-6 md:px-12 mx-auto max-w-7xl">
        <SectionHeading number="02" label="Il problema che risolviamo" title={<>Trovare un artigiano affidabile non dovrebbe essere <span className="text-[#F2A93B]">un'odissea.</span></>} />
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <Reveal>
            <div data-testid="problem-pains">
              <p className="text-white/50 text-base md:text-lg max-w-md">Trovare un artigiano affidabile è spesso difficile. Ti sarà capitato almeno una volta:</p>
              <ul className="mt-8 space-y-5">
                {PAINS.map((p, i) => (
                  <li key={i} className="flex items-center gap-4 text-white/40">
                    <span className="w-8 h-8 border border-white/10 flex items-center justify-center shrink-0">
                      <X className="w-4 h-4 text-white/40" strokeWidth={1.5} />
                    </span>
                    <span className="text-lg line-through decoration-white/20">{p}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-10 text-white/70 text-base md:text-lg max-w-md border-l-2 border-[#F2A93B] pl-6">
                COA nasce per semplificare tutto il processo: una richiesta, una sola attesa, il professionista giusto.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div data-testid="why-coa" className="bg-[#1C1C1E] border border-white/10 p-8 md:p-10">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B]">Perché scegliere COA</p>
              <ul className="mt-8 space-y-5">
                {BENEFITS.map((b, i) => (
                  <li key={i} data-testid={`benefit-${i}`} className="flex items-center gap-4 group">
                    <span className="w-8 h-8 bg-[#F2A93B]/10 border border-[#F2A93B]/30 flex items-center justify-center shrink-0 group-hover:bg-[#F2A93B] transition-colors duration-300">
                      <Check className="w-4 h-4 text-[#F2A93B] group-hover:text-black transition-colors duration-300" strokeWidth={2.5} />
                    </span>
                    <span className="text-lg text-white">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
