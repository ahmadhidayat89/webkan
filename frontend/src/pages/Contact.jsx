import { useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
} from "react-icons/fa";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const content = {
    title: "Hubungi Kami",
    subtitle: "Kami siap membantu Anda",
    form: {
      name: "Nama Lengkap",
      email: "Email",
      phone: "Nomor Telepon",
      subject: "Subjek",
      message: "Pesan",
      submit: "Kirim Pesan",
      submitting: "Mengirim...",
      success: "Pesan berhasil dikirim! Kami akan menghubungi Anda segera.",
    },
    info: {
      address:
        "Gedung I BPPT Lt. 20, Jl. M.H. Thamrin No. 8, Jakarta Pusat 10340",
      phone: "+62 21 316 0735",
      email: "info@kan.go.id",
      hours: "Senin - Jumat: 08:00 - 17:00 WIB",
    },
  };

  const t = content;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);

        setFormData({
          name: "",
          email: "",
          phone: "",
          subject: "",
          message: "",
        });

        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        alert(data.message || "Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("An error occurred. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Alamat",
      titleEn: "Address",
      content: t.info.address,
    },
    {
      icon: FaPhone,
      title: "Telepon",
      titleEn: "Phone",
      content: t.info.phone,
    },
    {
      icon: FaEnvelope,
      title: "Email",
      titleEn: "Email",
      content: t.info.email,
    },
    {
      icon: FaClock,
      title: "Jam Operasional",
      titleEn: "Operating Hours",
      content: t.info.hours,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative py-24 pt-32 overflow-hidden text-white bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900 lg:pt-40">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 bg-white rounded-full w-96 h-96 blur-3xl"></div>
          <div className="absolute bottom-0 right-0 rounded-full w-96 h-96 bg-accent-500 blur-3xl"></div>
        </div>

        <div className="container relative z-10 px-6 mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-4 text-4xl font-black leading-tight md:text-5xl">
              {t.title}
            </h1>

            <p className="text-base md:text-lg text-white/90">
              {t.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20">
        <div className="container px-6 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={index}
                    className="p-6 transition-all bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2 group"
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 mb-4 transition-transform shadow-lg rounded-xl group-hover:scale-110 bg-gradient-to-br from-primary-600 to-primary-700">
                      <Icon className="text-3xl text-white" />
                    </div>

                    <h3 className="mb-2 text-xl font-black text-gray-900">
                      {item.title}
                    </h3>

                    <p className="text-gray-600">{item.content}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form & Map */}
      <section className="py-20 bg-white">
        <div className="container px-6 mx-auto">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-12 lg:grid-cols-2">
              {/* Contact Form */}
              <div>
                <h2 className="mb-8 text-4xl font-black text-gray-900">
                  Kirim Pesan
                </h2>

                {submitted && (
                  <div className="p-4 mb-6 border-2 border-green-500 bg-green-50 rounded-xl">
                    <p className="flex items-center gap-2 font-semibold text-green-800">
                      <FaPaperPlane />
                      {t.form.success}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {t.form.name} *
                    </label>

                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 transition-all border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {t.form.email} *
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 transition-all border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {t.form.phone}
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-3 transition-all border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {t.form.subject} *
                    </label>

                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 transition-all border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-bold text-gray-700">
                      {t.form.message} *
                    </label>

                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 transition-all border-2 border-gray-300 resize-none rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex items-center justify-center w-full gap-3 px-8 py-4 text-lg font-bold text-white transition-all shadow-lg bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl hover:scale-105 hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaPaperPlane />

                    <span>
                      {submitting ? t.form.submitting : t.form.submit}
                    </span>
                  </button>
                </form>
              </div>

              {/* Map */}
              <div>
                <h2 className="mb-8 text-4xl font-black text-gray-900">
                  Lokasi Kami
                </h2>

                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200 h-[600px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6664849803897!2d106.82288931476895!3d-6.176104995527208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f42b33e1b4c3%3A0x7a6e6f7a6f7a6f7a!2sGedung%20BPPT%20I!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen=""
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;