import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

const WA_URL = `https://wa.me/393520248313?text=${encodeURIComponent(
  "Buongiorno COA, vorrei richiedere un intervento. Potete ricontattarmi?"
)}`;

export default function WhatsAppFloat() {
  return (
    <motion.a
      data-testid="whatsapp-float-button"
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contattaci su WhatsApp"
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.6, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[80] group flex items-center gap-0 bg-[#25D366] text-white rounded-full p-4 shadow-[0_8px_30px_rgba(37,211,102,0.35)] hover:shadow-[0_8px_40px_rgba(37,211,102,0.5)] transition-shadow"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
      <MessageCircle className="w-7 h-7 relative" strokeWidth={2} />
      <span className="max-w-0 overflow-hidden group-hover:max-w-[180px] group-hover:ml-3 transition-[max-width,margin] duration-500 text-sm font-medium whitespace-nowrap relative">
        Scrivici su WhatsApp
      </span>
    </motion.a>
  );
}
