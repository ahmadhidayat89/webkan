import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaCheckCircle,
  FaClipboardCheck,
  FaCertificate,
  FaFlask,
  FaIndustry,
  FaHeartbeat,
  FaLeaf,
  FaArrowRight,
} from "react-icons/fa";

const Services = () => {
  const navigate = useNavigate();

  const content = {
    title: "Layanan Akreditasi",
      subtitle: "Memberikan Jaminan Kompetensi Berkelas Internasional",
      intro:
        "KAN menyediakan berbagai layanan akreditasi untuk lembaga penilaian kesesuaian sesuai dengan standar internasional ISO/IEC 17000 series.",
      services: [
        {
          icon: FaFlask,
          title: "Laboratorium Pengujian",
          desc: "Akreditasi untuk laboratorium yang melakukan pengujian (ISO/IEC 17025)",
          features: ["Pengujian Kimia", "Pengujian Fisika", "Pengujian Biologi", "Pengujian Lingkungan"],
          color: "from-blue-500 to-blue-600",
          link: "/layanan/laboratorium",
        },
        {
          icon: FaCertificate,
          title: "Lembaga Sertifikasi",
          desc: "Akreditasi lembaga sertifikasi produk, personel, dan sistem manajemen",
          features: ["Sertifikasi Produk (ISO/IEC 17065)", "Sertifikasi Personel (ISO/IEC 17024)", "Sertifikasi Sistem (ISO/IEC 17021)"],
          color: "from-green-500 to-green-600",
          link: "/layanan/sertifikasi-sni-iso-iec-17065",
        },
        {
          icon: FaClipboardCheck,
          title: "Lembaga Inspeksi",
          desc: "Akreditasi untuk lembaga inspeksi (ISO/IEC 17020)",
          features: ["Inspeksi Tipe A", "Inspeksi Tipe B", "Inspeksi Tipe C", "Inspeksi Khusus"],
          color: "from-purple-500 to-purple-600",
          link: "/layanan/lembaga-inspeksi",
        },
        {
          icon: FaHeartbeat,
          title: "Laboratorium Medis",
          desc: "Akreditasi laboratorium medis dan klinik (ISO 15189)",
          features: ["Patologi Klinik", "Mikrobiologi", "Imunologi", "Molekuler"],
          color: "from-red-500 to-red-600",
          link: "/layanan/laboratorium",
        },
        {
          icon: FaIndustry,
          title: "Produser Bahan Acuan",
          desc: "Akreditasi produser bahan acuan (ISO 17034)",
          features: ["Bahan Acuan Kimia", "Bahan Acuan Biologi", "Bahan Acuan Fisika"],
          color: "from-orange-500 to-orange-600",
          link: "/layanan/produsen-bahan-acuan",
        },
        {
          icon: FaLeaf,
          title: "Verifikasi & Validasi GRK",
          desc: "Akreditasi verifikasi dan validasi gas rumah kaca (ISO 14065)",
          features: ["Verifikasi Emisi", "Validasi Proyek", "Carbon Credit"],
          color: "from-teal-500 to-teal-600",
          link: "/layanan/lembaga-verifikasi-validasi-grk",
        },
      ],
      process: {
        title: "Proses Akreditasi",
        steps: [
          {
            num: "01",
            title: "Pengajuan",
            desc: "Mengisi formulir dan dokumen persyaratan",
          },
          {
            num: "02",
            title: "Evaluasi",
            desc: "Tinjauan dokumen dan asesmen lapangan",
          },
          {
            num: "03",
            title: "Keputusan",
            desc: "Komite akreditasi membuat keputusan",
          },
          {
            num: "04",
            title: "Sertifikat",
            desc: "Penerbitan sertifikat akreditasi",
          },
        ],
      },
      benefits: {
        title: "Manfaat Akreditasi",
        items: [
          "Pengakuan Internasional",
          "Meningkatkan Kredibilitas",
          "Akses Pasar Global",
          "Peningkatan Kompetensi",
          "Jaminan Kualitas",
          "Kepercayaan Stakeholder",
        ],
      },
  };

  const t = content;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white py-24 pt-32 lg:pt-40 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent-500 rounded-full blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-black mb-6 leading-tight">
              {t.title}
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-6 font-semibold">
              {t.subtitle}
            </p>
            <p className="text-lg text-white/80 max-w-3xl mx-auto">{t.intro}</p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {t.services.map((service) => {
                const Icon = service.icon;
                return (
                  <div
                    key={service.title}
                    className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all group flex flex-col"
                  >
                    <div
                      className={`w-20 h-20 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <Icon className="text-4xl text-white" />
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3">
                      {service.title}
                    </h3>

                    <p className="text-gray-600 mb-6">{service.desc}</p>

                    <div className="space-y-2 flex-1">
                      {service.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm">
                          <FaCheckCircle className="text-primary-600 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate(service.link)}
                      className="mt-6 flex items-center gap-2 text-sm font-bold text-primary-600 hover:text-primary-700 transition-colors group/btn"
                    >
                      <span>Selengkapnya</span>
                      <FaArrowRight className="text-xs group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-16 text-center">
              {t.process.title}
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {t.process.steps.map((step, index) => (
                <div key={step.num} className="relative">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-primary-200 hover:shadow-2xl hover:-translate-y-2 transition-all">
                    <div className="text-6xl font-black text-primary-600/20 mb-4">
                      {step.num}
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
                      {step.title}
                    </h3>
                    <p className="text-gray-600">{step.desc}</p>
                  </div>

                  {index < t.process.steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-primary-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-12 text-center">
              {t.benefits.title}
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {t.benefits.items.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-6 border-2 border-primary-200 hover:border-primary-600 transition-all group"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <FaCheckCircle className="text-2xl text-white" />
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {benefit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Siap Untuk Mendapatkan Akreditasi?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Hubungi kami untuk informasi lebih lanjut tentang layanan akreditasi
            </p>
            <a
              href="/kontak"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-primary-900 rounded-xl font-bold text-lg hover:scale-105 transition-all shadow-lg"
            >
              Hubungi Kami
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
