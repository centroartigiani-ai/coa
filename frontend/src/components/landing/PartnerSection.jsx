import { Check, ArrowUpRight, Inbox, ClipboardCheck, Compass, PhoneForwarded, Star } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";

const PARTNER_IMG = "https://images.unsplash.com/photo-1542621334-a254cf47733d";

const BENEFITS = [
  "Nuovi clienti",
  "Richieste già qualificate",
  "Maggiore visibilità",
  "Gestione semplice delle richieste",
  "Possibilità di diventare Partner Premium",
];

const FLOW = [
  { icon: Inbox, label: "Riceviamo la richiesta" },
  { icon: ClipboardCheck, label: "La qualifichiamo" },
  { icon: Compass, label: "Individuiamo il partner migliore" },
  { icon: PhoneForwarded, label: "Il cliente viene ricontattato rapidamente" },
  { icon: Star, label: "Raccolta recensione finale" },
];

export default function PartnerSection({ onPartner }) {
  return (
    <section id="partner" data-testid="partner-section" className="bg-[#26241F] border-y border-[#F5F1EA]/10">
      <div className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <SectionHeading number="05" label="Diventa partner" title={<>Sei un artigiano? <span className="text-[#F2A93B]">Lavora con noi.</span></>} />
          <Reveal delay={0.15}>
            <p className="mt-8 text-white/60 text-base md:text-lg max-w-md">
              Ricevi richieste di lavoro realmente interessate senza dover investire in pubblicità.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <ul className="mt-8 space-y-4">
              {BENEFITS.map((b, i) => (
                <li key={i} data-testid={`partner-benefit-${i}`} className="flex items-center gap-4">
                  <span className="w-7 h-7 bg-[#F2A93B]/10 border border-[#F2A93B]/30 flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-[#F2A93B]" strokeWidth={2.5} />
                  </span>
                  <span className="text-white/80">{b}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={0.35}>
            <button
              data-testid="partner-section-cta"
              onClick={onPartner}
              className="group mt-10 bg-[#F2A93B] text-[#1C1C1E] px-8 py-4 font-medium inline-flex items-center gap-2 hover:bg-[#D98E1F] transition-colors"
            >
              Candidati come Partner
              <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </Reveal>
        </div>
        <Reveal delay={0.2}>
          <div className="relative">
            <div className="absolute -bottom-4 -right-4 w-full h-full border border-[#F2A93B]/40" />
            <img data-testid="partner-image" src={PARTNER_IMG} alt="Artigiano partner COA al lavoro su un progetto a Varese" className="relative w-full h-[420px] object-cover border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" />
          </div>
        </Reveal>
      </div>

      <div className="mt-32">
        <Reveal>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#F2A93B] mb-6 flex items-center gap-3">
            <span className="inline-block w-10 h-px bg-[#F2A93B]" />
            Come lavoriamo
          </p>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-white/10 border border-white/10">
          {FLOW.map((f, i) => (
            <Reveal key={i} delay={i * 0.08} className="bg-[#1C1C1E]">
              <div data-testid={`flow-step-${i + 1}`} className="p-6 h-full bg-[#1C1C1E] hover:bg-[#26241F] transition-colors duration-500">
                <span className="font-display text-sm font-black text-white/20">0{i + 1}</span>
                <f.icon className="w-5 h-5 text-[#F2A93B] mt-4" strokeWidth={1.5} />
                <p className="mt-4 text-sm text-white/70 leading-snug">{f.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
}
