import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';

// ─── Animated Count-Up Number ─────────────────────────────────────────────
const CountUp = ({ end, duration = 1500, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime;
    let animationFrame;

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return <span>{prefix}{count.toLocaleString('id-ID')}{suffix}</span>;
};

// Class transisi untuk tiap slide: aktif, sebelumnya, atau lainnya
const slideStateClass = (index, currentSlide, total) => {
  if (index === currentSlide) {
    return 'opacity-100 scale-100 z-10';
  }
  if (index === (currentSlide - 1 + total) % total) {
    return 'opacity-0 scale-110 z-0';
  }
  return 'opacity-0 scale-95 z-0';
};

const HeroSlider = ({ sliders }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 6000);

    return () => clearInterval(timer);
  }, [currentSlide, sliders.length]);

  // Parallax effect - only on desktop
  useEffect(() => {
    if (isMobile) return;
    
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 20;
      const y = (e.clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isMobile]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % sliders.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + sliders.length) % sliders.length);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  const goToSlide = (index) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 800);
  };

  if (!sliders || sliders.length === 0) {
    return (
      <div className="relative flex items-center justify-center h-screen overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 h-64 rounded-full md:w-96 md:h-96 bg-primary-500/20 blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 delay-1000 rounded-full md:w-96 md:h-96 bg-accent-500/20 blur-3xl animate-pulse"></div>
        </div>

        {/* Content - Responsive */}
        <div className="relative z-10 max-w-4xl px-4 mx-auto text-center text-white">
          <div className="inline-block mb-6">
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-black text-white border shadow-2xl md:w-20 lg:w-24 md:h-20 lg:h-24 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl md:text-3xl lg:text-4xl border-white/20">
              KAN
            </div>
          </div>
          <h1 className="mb-4 text-3xl font-black leading-tight text-transparent sm:text-4xl md:text-5xl lg:text-6xl md:mb-6 bg-clip-text bg-gradient-to-r from-white via-white to-gray-300">
            Komite Akreditasi Nasional
          </h1>
          <p className="px-4 text-base font-light sm:text-lg md:text-xl lg:text-2xl text-white/90">
            Lembaga Akreditasi Nasional Terpercaya
          </p>
          
          {/* CTA Buttons - Responsive */}
          <div className="flex flex-col justify-center gap-3 px-4 mt-8 sm:flex-row md:gap-4 md:mt-12">
            <a href="/layanan" className="relative px-6 py-3 overflow-hidden text-base font-bold transition-all bg-white shadow-2xl group md:px-8 md:py-4 text-primary-900 rounded-xl md:rounded-2xl md:text-lg hover:scale-105">
              <span className="relative z-10">Mulai Akreditasi</span>
              <div className="absolute inset-0 transition-transform duration-500 translate-y-full bg-gradient-to-r from-accent-400 to-accent-600 group-hover:translate-y-0"></div>
            </a>
            <a href="/tentang-kan" className="px-6 py-3 text-base font-bold text-white transition-all border-2 shadow-2xl group md:px-8 md:py-4 bg-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl md:text-lg border-white/30 hover:bg-white/20 hover:scale-105">
              Pelajari Lebih Lanjut
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen overflow-hidden">
      {/* Slides */}
      {sliders.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ${slideStateClass(index, currentSlide, sliders.length)}`}
        >
          {/* Background Image with Parallax - only on desktop */}
          <div 
            className="absolute inset-0 transition-transform duration-1000 scale-110 bg-center bg-cover"
            style={{
              backgroundImage: `url(${slide.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&h=1080&fit=crop&q=80'})`,
              transform: isMobile 
                ? 'scale(1.1)' 
                : `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px) scale(1.1)`,
            }}
          >
            {/* Multi-layer Overlay for Depth */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-900/50 to-transparent"></div>
          </div>

          {/* Animated Particles - hidden on mobile */}
          {!isMobile && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute w-2 h-2 rounded-full top-1/4 left-1/4 bg-white/30 animate-float"></div>
              <div className="absolute w-1 h-1 rounded-full top-1/3 right-1/3 bg-white/40 animate-float-delayed"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full animate-float"></div>
            </div>
          )}

          {/* Content - Responsive */}
          <div className="container relative z-20 flex items-center h-full px-4 py-8 sm:px-6">
            <div className="flex items-center justify-between w-full gap-8 xl:gap-12">
            <div className="max-w-3xl lg:max-w-none lg:w-[55%]">
              {/* Title with Stagger Animation - Responsive */}
              <h1 className="mb-3 text-2xl font-black leading-snug text-white sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl md:mb-4 lg:mb-6 animate-slideInLeft">
                {slide.title}
              </h1>

              {/* Subtitle - Responsive */}
              {slide.subtitle && (
                <p className="max-w-2xl mb-4 text-sm font-light leading-relaxed sm:text-base md:text-lg lg:text-xl md:mb-6 lg:mb-8 text-white/90 animate-slideInLeft animation-delay-200 drop-shadow-lg">
                  {slide.subtitle}
                </p>
              )}

              {/* CTA Buttons - Responsive */}
              <div className="flex flex-col gap-3 sm:flex-row md:gap-4 animate-slideInLeft animation-delay-400">
                {slide.link && (
                  <a
                    href={slide.link}
                    className="relative px-6 py-3 overflow-hidden text-sm font-bold text-white transition-all shadow-2xl group md:px-8 md:py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 rounded-xl md:rounded-2xl md:text-base lg:text-lg hover:scale-105 hover:shadow-primary-500/50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                      <span className="hidden sm:inline">Selengkapnya</span>
                      <span className="sm:hidden">Lihat</span>
                      <span className="transition-transform group-hover:translate-x-1">→</span>
                    </span>
                  </a>
                )}
                <a
                  href="#quick-links"
                  className="flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-white transition-all border-2 shadow-2xl group md:px-8 md:py-4 bg-white/10 backdrop-blur-xl rounded-xl md:rounded-2xl md:text-base lg:text-lg border-white/30 hover:bg-white/20 hover:scale-105 md:gap-3"
                >
                  <FaPlay className="text-xs transition-transform md:text-sm group-hover:scale-110" />
                  <span className="hidden sm:inline">Pelajari Lebih Lanjut</span>
                  <span className="sm:hidden">Pelajari</span>
                </a>
              </div>

              {/* Stats Bar - Responsive, dengan animasi count-up */}
              <div className="flex flex-wrap gap-4 mt-6 sm:gap-6 md:gap-8 md:mt-8 lg:mt-10 animate-slideInLeft animation-delay-600">
                <div className="flex flex-col">
                  <span className="mb-1 text-xl font-black text-white sm:text-2xl md:text-3xl lg:text-4xl">
                    <CountUp end={1200} suffix="+" />
                  </span>
                  <span className="text-xs text-white/70 sm:text-sm">Organisasi Terakreditasi</span>
                </div>
                <div className="flex flex-col">
                  <span className="mb-1 text-xl font-black text-white sm:text-2xl md:text-3xl lg:text-4xl">
                    <CountUp end={25} suffix="+" />
                  </span>
                  <span className="text-xs text-white/70 sm:text-sm">Tahun Pengalaman</span>
                </div>
                <div className="flex flex-col">
                  <span className="mb-1 text-xl font-black text-white sm:text-2xl md:text-3xl lg:text-4xl">ISO 17011</span>
                  <span className="text-xs text-white/70 sm:text-sm">Standar Internasional</span>
                </div>
              </div>
            </div>

            {/* Foto di sisi kanan - diunggah admin lewat menu Sliders (field gambar) */}
            {slide.image && (
              <div className="hidden lg:block lg:w-[45%] flex-shrink-0">
                <div className="relative aspect-[16/10] rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/20 bg-white/10">
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="object-cover w-full h-full transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/25 via-transparent to-transparent"></div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - polos tanpa lingkaran */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute z-30 p-2 transition-all -translate-y-1/2 left-2 sm:left-4 md:left-8 top-1/2 text-white/70 hover:text-white hover:scale-125 disabled:opacity-50"
        aria-label="Previous slide"
      >
        <FaChevronLeft size={24} className="md:text-3xl lg:text-4xl" />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute z-30 p-2 transition-all -translate-y-1/2 right-2 sm:right-4 md:right-8 top-1/2 text-white/70 hover:text-white hover:scale-125 disabled:opacity-50"
        aria-label="Next slide"
      >
        <FaChevronRight size={24} className="md:text-3xl lg:text-4xl" />
      </button>

      {/* Dots Indicator - polos, tanpa angka */}
      <div className="absolute z-30 flex items-center gap-2 -translate-x-1/2 bottom-6 sm:bottom-8 md:bottom-12 left-1/2 md:gap-3">
        {sliders.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className="relative group disabled:opacity-50"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div
              className={`rounded-full transition-all shadow-lg ${
                index === currentSlide
                  ? 'w-3 h-3 md:w-3.5 md:h-3.5 bg-white'
                  : 'w-2 h-2 md:w-3 md:h-3 bg-white/40 hover:bg-white/60 hover:scale-125'
              }`}
            ></div>
          </button>
        ))}
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <div className="absolute z-30 flex-col items-center hidden gap-2 bottom-6 md:bottom-8 left-4 md:left-8 md:flex text-white/60 animate-bounce">
        <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
        <div className="w-0.5 h-8 md:h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroSlider;
