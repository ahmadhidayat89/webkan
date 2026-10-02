import { useState, useEffect } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

const toWhatsappNumber = (raw) => {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) return '62' + digits.slice(1);
  if (digits.startsWith('62')) return digits;
  return digits;
};

const WhatsappFloat = ({ number }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const wa = toWhatsappNumber(number);
  if (!wa) return null;

  return (
    <a
      href={`https://wa.me/${wa}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp"
      className="fixed right-8 z-50 group flex items-center justify-end"
      style={{
        bottom: scrolled ? '6rem' : '2rem',
        transition: 'bottom 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Tooltip */}
      <span className="mr-3 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap pointer-events-none shadow-lg">
        Chat WhatsApp
      </span>

      {/* Button */}
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-30" />
        <div className="relative w-14 h-14 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-500/40 hover:shadow-green-500/60 hover:scale-110 active:scale-95 transition-all duration-300">
          <FaWhatsapp size={26} />
        </div>
      </div>
    </a>
  );
};

export default WhatsappFloat;
