import { Send, SearchCheck, UserCheck, PhoneCall } from "lucide-react";
import { Reveal, SectionHeading } from "@/components/Reveal";

const STEPS = [
  { icon: Send, title: "Invia la richiesta", text: "Compila il modulo oppure contattaci telefonicamente. Bastano pochi dettagli." },
  { icon: SearchCheck, title: "Analizziamo il tuo problema", text: "Valutiamo tipo di intervento, urgenza, località e disponibilità." },
  { icon: UserCheck, title: "Troviamo il professionista ideale", text: "Il sistema individua l'artigiano più vicino e disponibile." },
  { icon: PhoneCall, title: "Vieni ricontattato", text: "Il professionista ti contatta entro 15 minuti dalla richiesta." },
];

export default function HowItWorks() {
  return (
    <section id="come-funziona" data-testid="how-it-works-section" className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <SectionHeading number="01" label="Come funziona" title={<>Dal problema all'artigiano, <span className="text-[#FF5A00]">in quattro mosse.</span></>} />
      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
        {STEPS.map((s, i) => (
          <Reveal key={i} delay={i * 0.1} className="bg-[#0A0A0A]">
            <div data-testid={`step-card-${i + 1}`} className="group p-8 h-full bg-[#0A0A0A] hover:bg-[#111111] transition-colors duration-500">
              <div className="flex items-start justify-between">
                <s.icon className="w-6 h-6 text-[#FF5A00]" strokeWidth={1.5} />
                <span className="font-display text-5xl font-black text-white/10 group-hover:text-[#FF5A00]/40 transition-colors duration-500">0{i + 1}</span>
              </div>
              <h3 className="mt-10 text-xl sm:text-2xl font-medium text-white">{s.title}</h3>
              <p className="mt-3 text-sm text-white/50 leading-relaxed">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
