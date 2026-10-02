import { useState, useEffect } from 'react';
import Navbar from '../components/Header';
import Hero from '../components/HeroSlider';
import QuickLinks from '../components/QuickLinks';
import NewsSection from '../components/NewsSection';
import Partners from '../components/Partners';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import { getHomeData } from '../services/api';
import SEO from '../components/SEO';

const Home = () => {
  const [homeData, setHomeData] = useState({
    sliders: [],
    quick_links: [],
    latest_news: [],
    partners: [],
    faqs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const response = await getHomeData('id');
      if (response.data.success) {
        setHomeData(response.data.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-900">
        <div className="text-center text-white">
          <div className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-xl">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchHomeData}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition-all"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <SEO />
      {/* Navbar - Sticky di atas */}
      <Navbar />
      
      {/* Hero Slider */}
      <Hero sliders={homeData.sliders} />

      {/* Quick Links */}
      <QuickLinks links={homeData.quick_links} />

      {/* Latest News */}
      <NewsSection news={homeData.latest_news} />

      {/* Partners */}
      <Partners partners={homeData.partners} />

      {/* FAQ */}
      <FAQSection items={homeData.faqs} />

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Butuh Informasi Lebih Lanjut?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-white/90">
            Tim kami siap membantu Anda dalam proses akreditasi dan menjawab pertanyaan Anda.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/kontak"
              className="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-gray-100 transition-all"
            >
              Hubungi Kami
            </a>
            <a
              href="/proses-akreditasi"
              className="px-8 py-4 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm rounded-xl font-bold text-lg border-2 border-white/30 transition-all"
            >
              Panduan Akreditasi
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
