import { useState, useEffect } from 'react';
import Navbar from '../components/Header';
import Hero from '../components/HeroSlider';
import QuickLinks from '../components/QuickLinks';
import NewsSection from '../components/NewsSection';
import Partners from '../components/Partners';
import FAQSection from '../components/FAQSection';
import Footer from '../components/Footer';
import { getHomeData } from '../services/api';

const Home = () => {
  const [homeData, setHomeData] = useState({
    sliders: [],
    quick_links: [],
    latest_news: [],
    partners: [],
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
      console.error('Error fetching home data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-600 to-primary-900">
        <div className="text-center text-white">
          <div className="inline-block w-16 h-16 mb-4 border-4 border-white rounded-full border-t-transparent animate-spin"></div>
          <p className="text-xl">Memuat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h1 className="mb-2 text-2xl font-bold text-gray-800">Terjadi Kesalahan</h1>
          <p className="mb-4 text-gray-600">{error}</p>
          <button
            onClick={fetchHomeData}
            className="px-6 py-3 font-bold text-white transition-all rounded-lg bg-primary-600 hover:bg-primary-700"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar - Sticky di atas */}
      <Navbar />

      {/* Hero Slider */}
      <Hero sliders={homeData.sliders} />

      {/* Quick Links */}
      <QuickLinks links={homeData.quick_links} />

      {/* Latest News */}
      {/* Latest News */}
      <NewsSection
        news={[...homeData.latest_news]
          .sort(
            (a, b) =>
              new Date(b.published_at || b.created_at) -
              new Date(a.published_at || a.created_at)
          )
          .slice(0, 3)}
      />
      {/* Partners */}
      <Partners partners={homeData.partners} />

      {/* FAQ Section */}
      <FAQSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;