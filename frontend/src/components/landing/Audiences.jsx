import { Home, Building2, Factory } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";

const AUDIENCES = [
  { icon: Home, title: "Privati", text: "Manutenzione casa a Varese: interventi domestici rapidi e affidabili, dal rubinetto che perde al quadro elettrico." },
  { icon: Building2, title: "Condomini", text: "L'artigiano per amministratori di condominio a Varese: gestione veloce delle richieste comuni con un unico interlocutore." },
  { icon: Factory, title: "Aziende", text: "Manutenzione impianti aziendali e pronto intervento tecnico per aziende a Varese e provincia." },
];

export default function Audiences() {
  return (
    <section id="per-chi" data-testid="audiences-section" className="py-24 md:py-32 bg-[#26241F] border-y border-white/10">
      <div className="px-6 md:px-12 mx-auto max-w-7xl">
        <SectionHeading number="04" label="Per chi è il servizio" title={<>Pensato per chi non ha tempo <span className="text-[#F2A93B]">da perdere.</span></>} />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {AUDIENCES.map((a, i) => (
            <Reveal key={i} delay={i * 0.12}>
              <div data-testid={`audience-card-${i}`} className="group h-full bg-[#1C1C1E] border border-white/10 p-10 hover:border-[#F2A93B]/60 transition-colors duration-500">
                <span className="w-14 h-14 border border-white/10 flex items-center justify-center group-hover:border-[#F2A93B] group-hover:bg-[#F2A93B] transition-colors duration-500">
                  <a.icon className="w-6 h-6 text-[#F2A93B] group-hover:text-black transition-colors duration-500" strokeWidth={1.5} />
                </span>
                <h3 className="mt-10 font-display text-2xl sm:text-3xl font-bold text-white">{a.title}</h3>
                <p className="mt-4 text-white/50 leading-relaxed">{a.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
