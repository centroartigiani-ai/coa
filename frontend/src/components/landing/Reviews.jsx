import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Reveal } from "@/components/Reveal";

export default function Reviews() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/reviews/public").then((r) => setReviews(r.data)).catch(() => {});
  }, []);

  if (!reviews.length) return null;

  return (
    <section id="recensioni" data-testid="reviews-section" className="py-24 md:py-32 px-6 md:px-12 mx-auto max-w-7xl">
      <Reveal>
        <p data-testid="section-label-07" className="font-mono-data text-xs tracking-[0.3em] uppercase text-[#F2A93B] mb-6 flex items-center gap-3">
          <span className="inline-block w-10 h-px bg-[#F2A93B]" />
          07 — Dicono di noi
        </p>
      </Reveal>
      <Reveal delay={0.1}>
        <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-[#F5F1EA] max-w-3xl leading-[1.05]">
          La fiducia si misura <span className="text-[#F2A93B]">sul campo.</span>
        </h2>
      </Reveal>
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        {reviews.map((r, i) => (
          <Reveal key={r.id} delay={i * 0.1}>
            <div data-testid={`review-card-${i}`} className="h-full bg-[#26241F] border border-[#F5F1EA]/10 p-8 flex flex-col">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${r.rating >= n ? "text-[#F2A93B]" : "text-[#F5F1EA]/15"}`} fill={r.rating >= n ? "#F2A93B" : "none"} strokeWidth={1.5} />
                ))}
              </div>
              <p className="mt-5 text-[#F5F1EA]/75 leading-relaxed flex-1">"{r.text}"</p>
              <div className="mt-6 pt-5 border-t border-[#F5F1EA]/10 flex items-center justify-between">
                <span className="font-medium text-[#F5F1EA]">{r.nome}</span>
                <span className="font-mono-data text-[10px] tracking-widest uppercase text-[#F5F1EA]/40">{r.tipo_intervento}</span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
