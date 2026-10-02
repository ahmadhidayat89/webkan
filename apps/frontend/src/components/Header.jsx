import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaPhone,
  FaEnvelope,
  FaChevronDown,
} from 'react-icons/fa';
import { getPublicMenus } from '../services/api';
import { getStoredSiteLogo, setStoredSiteLogo, SITE_LOGO_UPDATED_EVENT } from '../utils/siteLogo';
import WhatsappFloat from './WhatsappFloat';
import kanLogo from '../assets/kan.png';

const Header = () => {
  const eTrainingUrl = import.meta.env.VITE_E_TRAINING_URL || 'http://127.0.0.1:8002/login';
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);   // controls CSS visibility
  const [displayedDropdown, setDisplayedDropdown] = useState(null); // controls which content renders
  const [logoUrl, setLogoUrl] = useState(() => getStoredSiteLogo());
  const [navItems, setNavItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kan_menus')) || []; } catch { return []; }
  });
  const closeTimer = useRef(null);
  const hideTimer = useRef(null);

  const openDropdown = (index) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setDisplayedDropdown(index);        // show content immediately
    requestAnimationFrame(() => setActiveDropdown(index)); // trigger CSS transition in next frame
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => {
      setActiveDropdown(null);          // start fade-out
      hideTimer.current = setTimeout(() => setDisplayedDropdown(null), 220); // remove DOM after transition
    }, 100);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  };

  const closeNow = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setActiveDropdown(null);
    setDisplayedDropdown(null);
  };
  const [contactSettings, setContactSettings] = useState({
    contact_phone: '081388636959',
    contact_email: 'laboratorium@bsn.go.id',
    whatsapp_number: '081388636959',
    social_facebook: 'https://facebook.com',
    social_twitter: 'https://twitter.com',
    social_instagram: 'https://instagram.com',
    social_youtube: 'https://youtube.com',
  });
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q.length < 2) return;
    navigate(`/cari?q=${encodeURIComponent(q)}`);
    setSearchQuery('');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/v1/settings?group=general')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.site_logo) {
          setLogoUrl(data.data.site_logo);
          setStoredSiteLogo(data.data.site_logo);
        }
      })
      .catch(() => {});

    fetch('/api/v1/settings?group=contact')
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) {
          setContactSettings((prev) => ({ ...prev, ...data.data }));
        }
      })
      .catch(() => {});

    getPublicMenus()
      .then((res) => {
        const data = res.data;
        if (data.success && data.data) {
          const mapped = data.data.map((m) => ({
            label: m.title_id,
            href: m.url || '#',
            ...(m.children && m.children.length > 0
              ? {
                  dropdown: m.children.map((c) => ({
                    label: c.title_id,
                    href: c.url || '#',
                  })),
                }
              : {}),
          }));
          setNavItems(mapped);
          localStorage.setItem('kan_menus', JSON.stringify(mapped));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleLogoUpdated = (event) => {
      setLogoUrl(event.detail || null);
    };

    window.addEventListener(SITE_LOGO_UPDATED_EVENT, handleLogoUpdated);
    return () => window.removeEventListener(SITE_LOGO_UPDATED_EVENT, handleLogoUpdated);
  }, []);

  const activeItem = displayedDropdown !== null ? navItems[displayedDropdown] : null;

  return (
    <>

      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? 'bg-white/85 backdrop-blur-xl shadow-2xl shadow-primary-500/10'
            : 'bg-black/20 backdrop-blur-md border-b border-white/10'
        }`}
      >
        {!isScrolled && (
          <div className="hidden md:block bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 text-white">
            <div className="w-full px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-2 text-xs">
                <div className="flex items-center space-x-4 lg:space-x-6">
                  <a href={`tel:${contactSettings.contact_phone}`} className="flex items-center gap-1.5 hover:text-accent-300 transition-colors group">
                    <FaPhone className="text-[10px] group-hover:animate-pulse" />
                    <span className="font-medium hidden sm:inline">{contactSettings.contact_phone}</span>
                    <span className="font-medium sm:hidden">Telepon</span>
                  </a>
                  <a href={`mailto:${contactSettings.contact_email}`} className="flex items-center gap-1.5 hover:text-accent-300 transition-colors group">
                    <FaEnvelope className="text-[10px] group-hover:animate-pulse" />
                    <span className="font-medium hidden lg:inline">{contactSettings.contact_email}</span>
                    <span className="font-medium lg:hidden">Email</span>
                  </a>
                </div>

                <div className="flex items-center space-x-3 lg:space-x-4">
                  <span className="text-[10px] opacity-80 hidden lg:inline">Follow us:</span>
                  {contactSettings.social_facebook && (
                    <a href={contactSettings.social_facebook} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300 transition-all hover:scale-110">
                      <FaFacebookF size={11} />
                    </a>
                  )}
                  {contactSettings.social_twitter && (
                    <a href={contactSettings.social_twitter} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300 transition-all hover:scale-110">
                      <FaTwitter size={11} />
                    </a>
                  )}
                  {contactSettings.social_instagram && (
                    <a href={contactSettings.social_instagram} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300 transition-all hover:scale-110">
                      <FaInstagram size={11} />
                    </a>
                  )}
                  {contactSettings.social_youtube && (
                    <a href={contactSettings.social_youtube} target="_blank" rel="noopener noreferrer" className="hover:text-accent-300 transition-all hover:scale-110">
                      <FaYoutube size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={`${isScrolled ? 'py-2 md:py-3' : 'py-3 md:py-4'} transition-all duration-300`}>
          <div className="w-full px-4 sm:px-6 lg:px-8 relative" onMouseLeave={scheduleClose}>
            <div className="flex items-center justify-between">
              <a href="/" className="flex items-center group relative flex-shrink-0">
                <img
                  src={logoUrl || kanLogo}
                  alt="Logo KAN"
                  className="h-12 md:h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </a>

              <div className="hidden xl:block relative">
                <nav className="flex items-center space-x-1">
                  {navItems.map((item, index) => (
                    <div
                      key={index}
                      className="relative"
                      onMouseEnter={() => item.dropdown ? openDropdown(index) : closeNow()}
                      onMouseLeave={item.dropdown ? scheduleClose : undefined}
                    >
                      <a
                        href={item.href}
                        className={`${
                          isScrolled
                            ? 'text-gray-700 hover:text-primary-600'
                            : 'text-white/80 hover:text-white'
                        } px-3 lg:px-4 py-2.5 rounded-md font-semibold transition-all relative overflow-hidden text-xs lg:text-sm group/item flex items-center gap-1.5 lg:gap-2 whitespace-nowrap`}
                      >
                        <span
                          className={`absolute inset-0 ${
                            isScrolled
                              ? 'bg-primary-50'
                              : 'bg-white/20 border border-white/30'
                          } scale-0 group-hover/item:scale-100 transition-transform duration-200 rounded-xl`}
                        ></span>
                        <span className="relative z-10">{item.label}</span>
                        {item.dropdown && (
                          <FaChevronDown
                            className={`relative z-10 text-[10px] transition-transform duration-200 ${activeDropdown === index ? 'rotate-180' : ''}`}
                          />
                        )}
                        {isActive(item.href) && (
                          <span className="absolute left-3 right-3 bottom-1 h-0.5 bg-white rounded-full"></span>
                        )}
                      </a>
                    </div>
                  ))}
                </nav>

              </div>

              <div className="flex items-center space-x-2 md:space-x-3">
                <form onSubmit={handleSearch} className="hidden lg:block relative group">
                  <input
                    type="text"
                    placeholder="Cari..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`${
                      isScrolled
                        ? 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200 focus:bg-white'
                        : 'bg-white/10 text-white placeholder-white/50 border-white/20'
                    } pl-4 pr-9 py-2 rounded-xl w-36 lg:w-44 focus:w-52 lg:focus:w-64 transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-primary-400/60 border backdrop-blur-xl text-xs font-medium`}
                  />
                  <button type="submit" className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1">
                    <FaSearch className={`${isScrolled ? 'text-gray-400 group-hover:text-primary-600' : 'text-white/60 group-hover:text-white'} text-xs transition-colors`} />
                  </button>
                </form>

                <a
                  href="/kontak"
                  className="hidden xl:flex items-center gap-1.5 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all duration-200 hover:brightness-110 whitespace-nowrap bg-gradient-to-r from-primary-600 to-primary-700 text-white"
                  style={{ boxShadow: '0 4px 14px rgba(37,99,235,0.35)' }}
                >
                  Hubungi Kami &rarr;
                </a>
                <a
                  href={eTrainingUrl}
                  className={`hidden xl:flex items-center gap-1.5 px-4 lg:px-5 py-2 lg:py-2.5 rounded-xl font-bold text-xs lg:text-sm transition-all duration-200 hover:brightness-110 whitespace-nowrap border ${
                    isScrolled
                      ? 'bg-white text-primary-700 border-primary-200'
                      : 'bg-white/10 text-white border-white/25'
                  }`}
                >
                  E-Training &rarr;
                </a>

                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`xl:hidden ${
                    isScrolled ? 'text-gray-800 bg-gray-50' : 'text-white bg-white/10'
                  } p-2 md:p-3 rounded-xl transition-all hover:scale-110 backdrop-blur-xl border ${
                    isScrolled ? 'border-gray-200' : 'border-white/20'
                  }`}
                >
                  {isMobileMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
                </button>
              </div>
            </div>

            {displayedDropdown !== null && activeItem?.dropdown && (
              /* Bridge div â€” transparent gap-filler, still catches mouse events */
              <div
                className="hidden xl:block absolute left-0 right-0 top-full z-40"
                style={{ paddingTop: '6px' }}
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleClose}
              >
              <div
                className={`rounded-xl border overflow-hidden shadow-2xl ${
                  isScrolled
                    ? 'bg-white border-gray-200/80 shadow-gray-200/60'
                    : 'bg-gray-900/95 border-white/10 shadow-black/60'
                }`}
                style={{
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  opacity: activeDropdown !== null ? 1 : 0,
                  transform: activeDropdown !== null ? 'translateY(0)' : 'translateY(-8px)',
                  transition: 'opacity 0.2s cubic-bezier(0.4,0,0.2,1), transform 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                {!isScrolled && <div className="h-[3px] bg-gradient-to-r from-primary-500 to-primary-400"></div>}
                {activeItem.mega?.variant === 'directory-cards' ? (
                  <div
                    className={`grid grid-cols-3 min-h-[280px] ${isScrolled ? 'text-gray-800' : 'text-white'}`}
                    style={
                      isScrolled
                        ? undefined
                        : {
                            background: 'rgba(12, 18, 32, 0.98)',
                          }
                    }
                  >
                    {activeItem.mega.cards.map((card, cardIndex) => (
                      <div
                        key={cardIndex}
                        className={`p-8 ${cardIndex < activeItem.mega.cards.length - 1 ? (isScrolled ? 'border-r border-gray-200' : 'border-r border-white/25') : ''}`}
                      >
                        <h4 className="text-4xl font-extrabold leading-tight mb-3">{card.title}</h4>
                        <p className={`text-base leading-relaxed mb-8 max-w-sm ${isScrolled ? 'text-gray-600' : 'text-white/85'}`}>
                          {card.description}
                        </p>
                        <a
                          href={card.href}
                          className={`inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                            isScrolled
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              : 'bg-white/35 text-white hover:bg-white/45'
                          }`}
                        >
                          Selengkapnya
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={`grid grid-cols-12 min-h-[280px] ${isScrolled ? 'text-gray-800' : 'text-white'}`}
                    style={
                      isScrolled
                        ? undefined
                        : {
                            background: 'rgba(12, 18, 32, 0.98)',
                          }
                    }
                  >
                    <div
                      className={`col-span-4 p-8 border-r ${
                        isScrolled ? 'border-gray-100 bg-primary-50/70' : 'border-white/10 bg-white/[0.04]'
                      }`}
                    >
                      <h3 className="text-5xl font-extrabold leading-[0.95] mb-4">{activeItem.mega?.title || activeItem.label}</h3>
                      <p className={`max-w-[220px] text-xs leading-relaxed ${isScrolled ? 'text-gray-600' : 'text-white/80'}`}>
                        {activeItem.mega?.description || 'Temukan informasi lengkap pada menu ini.'}
                      </p>
                    </div>

                    <div className={`col-span-4 p-8 border-r ${isScrolled ? 'border-gray-100' : 'border-white/10'}`}>
                      <div className="space-y-3 pt-2">
                        {activeItem.dropdown.map((dropItem, dropIndex) => (
                          <a
                            key={dropIndex}
                            href={dropItem.href}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[14px] leading-tight font-medium transition-all group/drop ${
                              isScrolled
                                ? 'text-gray-700 hover:text-primary-700 hover:bg-primary-50'
                                : 'text-white/70 hover:text-white hover:bg-white/15 border border-transparent hover:border-white/20'
                            }`}
                          >
                            <span className={`w-1 h-1 rounded-full flex-shrink-0 transition-all ${
                              isScrolled ? 'bg-primary-300 group-hover/drop:bg-primary-600 group-hover/drop:w-2' : 'bg-white/30 group-hover/drop:bg-white group-hover/drop:w-2'
                            }`} />
                            {dropItem.label}
                          </a>
                        ))}
                      </div>
                    </div>

                    <div className="col-span-4 p-8">
                      <a href={activeItem.href} className="block group/preview">
                        <div
                          className={`h-40 rounded-sm overflow-hidden border mb-4 ${
                            isScrolled
                              ? 'border-gray-200 bg-gradient-to-br from-primary-100 to-primary-200'
                              : 'border-white/25 bg-gradient-to-br from-slate-900 to-slate-700'
                          }`}
                        >
                          <img
                            src={logoUrl || kanLogo}
                            alt={activeItem.label}
                            className="w-full h-full object-contain bg-white/95 group-hover/preview:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <p className="text-[42px] leading-none font-black">{activeItem.mega?.previewTitle || `Pelajari ${activeItem.label}`}</p>
                      </a>
                    </div>

                  </div>
                )}
              </div>
              </div>
            )}

            {isMobileMenuOpen && (
              <div className="xl:hidden mt-4 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn max-h-[70vh] overflow-y-auto">
                <div className="p-3 md:p-4 space-y-1">
                  {navItems.map((item, index) => (
                    <div key={index}>
                      <a
                        href={item.href}
                        className="flex items-center gap-2 md:gap-3 text-gray-700 hover:text-primary-600 hover:bg-gradient-to-r hover:from-primary-50 hover:to-primary-100 px-3 md:px-4 py-2.5 md:py-3 rounded-xl transition-all font-semibold text-sm md:text-base"
                        onClick={() => !item.dropdown && setIsMobileMenuOpen(false)}
                      >
                        <span>{item.label}</span>
                      </a>
                      {item.dropdown && (
                        <div className="ml-8 md:ml-10 mt-1 space-y-1">
                          {item.dropdown.map((dropItem, dropIndex) => (
                            <a
                              key={dropIndex}
                              href={dropItem.href}
                              className="block text-gray-600 hover:text-primary-600 px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {dropItem.label}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <form onSubmit={handleSearch} className="relative">
                      <input
                        type="text"
                        placeholder="Cari..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-gray-50 text-gray-800 px-4 py-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 font-medium text-sm"
                      />
                      <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2">
                        <FaSearch className="text-gray-400" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <WhatsappFloat number={contactSettings.whatsapp_number} />
    </>
  );
};

export default Header;
