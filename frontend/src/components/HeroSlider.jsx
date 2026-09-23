import { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlay } from 'react-icons/fa';

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
      <div className="relative h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 flex items-center justify-center overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 md:w-96 h-64 md:h-96 bg-primary-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-64 md:w-96 h-64 md:h-96 bg-accent-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* Content - Responsive */}
        <div className="text-center text-white relative z-10 max-w-4xl mx-auto px-4">
          <div className="inline-block mb-6">
            <div className="w-16 h-16 md:w-20 lg:w-24 md:h-20 lg:h-24 bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl flex items-center justify-center text-white font-black text-2xl md:text-3xl lg:text-4xl border border-white/20 shadow-2xl">
              KAN
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 md:mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-300">
            Komite Akreditasi Nasional
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 font-light px-4">
            Lembaga Akreditasi Nasional Terpercaya
          </p>
          
          {/* CTA Buttons - Responsive */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mt-8 md:mt-12 px-4">
            <a href="/layanan" className="group relative px-6 md:px-8 py-3 md:py-4 bg-white text-primary-900 rounded-xl md:rounded-2xl font-bold text-base md:text-lg overflow-hidden hover:scale-105 transition-all shadow-2xl">
              <span className="relative z-10">Mulai Akreditasi</span>
              <div className="absolute inset-0 bg-gradient-to-r from-accent-400 to-accent-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
            </a>
            <a href="/tentang-kan" className="group px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-xl text-white rounded-xl md:rounded-2xl font-bold text-base md:text-lg border-2 border-white/30 hover:bg-white/20 transition-all hover:scale-105 shadow-2xl">
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
          className={`absolute inset-0 transition-all duration-1000 ${
            index === currentSlide 
              ? 'opacity-100 scale-100 z-10' 
              : index === (currentSlide - 1 + sliders.length) % sliders.length
              ? 'opacity-0 scale-110 z-0'
              : 'opacity-0 scale-95 z-0'
          }`}
        >
          {/* Background Image with Parallax - only on desktop */}
          <div 
            className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-1000"
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
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/30 rounded-full animate-float"></div>
              <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/40 rounded-full animate-float-delayed"></div>
              <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-white/20 rounded-full animate-float"></div>
            </div>
          )}

          {/* Content - Responsive */}
          <div className="container relative h-full flex items-center z-20 px-4 sm:px-6 py-8">
            <div className="max-w-3xl">
              {/* Slide Number Badge - Responsive */}
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 backdrop-blur-xl rounded-full border border-white/20 text-white text-xs md:text-sm font-bold mb-4 md:mb-6 shadow-2xl">
                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-accent-400 rounded-full animate-pulse"></span>
                <span>Slide {currentSlide + 1} of {sliders.length}</span>
              </div>

              {/* Title with Stagger Animation - Responsive */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 md:mb-4 lg:mb-6 leading-snug text-white animate-slideInLeft">
                {slide.title}
              </h1>

              {/* Subtitle - Responsive */}
              {slide.subtitle && (
                <p className="text-sm sm:text-base md:text-lg lg:text-xl mb-4 md:mb-6 lg:mb-8 text-white/90 font-light max-w-2xl leading-relaxed animate-slideInLeft animation-delay-200 drop-shadow-lg">
                  {slide.subtitle}
                </p>
              )}

              {/* CTA Buttons - Responsive */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 animate-slideInLeft animation-delay-400">
                {slide.link && (
                  <a
                    href={slide.link}
                    className="group relative px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base lg:text-lg overflow-hidden transition-all hover:scale-105 shadow-2xl hover:shadow-primary-500/50"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2 md:gap-3">
                      <span className="hidden sm:inline">Selengkapnya</span>
                      <span className="sm:hidden">Lihat</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </span>
                  </a>
                )}
                <a
                  href="#quick-links"
                  className="group px-6 md:px-8 py-3 md:py-4 bg-white/10 backdrop-blur-xl text-white rounded-xl md:rounded-2xl font-bold text-sm md:text-base lg:text-lg border-2 border-white/30 hover:bg-white/20 transition-all hover:scale-105 shadow-2xl flex items-center gap-2 md:gap-3 justify-center"
                >
                  <FaPlay className="text-xs md:text-sm group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline">Pelajari Lebih Lanjut</span>
                  <span className="sm:hidden">Pelajari</span>
                </a>
              </div>

              {/* Stats Bar - Responsive */}
              <div className="flex flex-wrap gap-4 sm:gap-6 md:gap-8 mt-6 md:mt-8 lg:mt-10 animate-slideInLeft animation-delay-600">
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">1,200+</span>
                  <span className="text-white/70 text-xs sm:text-sm">Organisasi Terakreditasi</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">25+</span>
                  <span className="text-white/70 text-xs sm:text-sm">Tahun Pengalaman</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white mb-1">ISO 17011</span>
                  <span className="text-white/70 text-xs sm:text-sm">Standar Internasional</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Premium Navigation Arrows - Responsive */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-2 sm:left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 group disabled:opacity-50"
        aria-label="Previous slide"
      >
        <div className="w-12 h-12 md:w-14 lg:w-16 md:h-14 lg:h-16 rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl group-hover:border-white/50">
          <FaChevronLeft size={16} className="md:text-lg lg:text-xl group-hover:-translate-x-0.5 transition-transform" />
        </div>
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-2 sm:right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 group disabled:opacity-50"
        aria-label="Next slide"
      >
        <div className="w-12 h-12 md:w-14 lg:w-16 md:h-14 lg:h-16 rounded-full bg-white/10 backdrop-blur-xl border-2 border-white/30 flex items-center justify-center text-white hover:bg-white/20 hover:scale-110 transition-all shadow-2xl group-hover:border-white/50">
          <FaChevronRight size={16} className="md:text-lg lg:text-xl group-hover:translate-x-0.5 transition-transform" />
        </div>
      </button>

      {/* Premium Dots Indicator - Responsive */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 md:gap-3">
        {sliders.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className="group relative disabled:opacity-50"
            aria-label={`Go to slide ${index + 1}`}
          >
            {index === currentSlide ? (
              <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/20 backdrop-blur-xl rounded-full border border-white/30 shadow-2xl">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-white text-xs md:text-sm font-bold">{index + 1}</span>
              </div>
            ) : (
              <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-white/40 hover:bg-white/60 transition-all hover:scale-125 shadow-lg"></div>
            )}
          </button>
        ))}
      </div>

      {/* Scroll Indicator - Hidden on mobile */}
      <div className="absolute bottom-6 md:bottom-8 left-4 md:left-8 z-30 hidden md:flex flex-col items-center gap-2 text-white/60 animate-bounce">
        <span className="text-xs font-medium tracking-wider uppercase">Scroll</span>
        <div className="w-0.5 h-8 md:h-12 bg-gradient-to-b from-white/60 to-transparent"></div>
      </div>
    </div>
  );
};

export default HeroSlider;
