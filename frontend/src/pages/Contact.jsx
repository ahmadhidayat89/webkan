import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaExternalLinkAlt,
  FaExclamationCircle,
} from "react-icons/fa";
import useContactSettings, {
  phoneLink,
  mapsLink,
  gmailLink,
} from "../hooks/useContactSettings";

// ===== Lokasi KAN (peta) =====
// Link Google Maps resmi KAN
const MAP_LINK = "https://maps.app.goo.gl/nkwPBRbDZqYUqEnd6";
// ID tempat "Komite Akreditasi Nasional" -> menampilkan pin + kartu tempat
const MAP_EMBED =
  "https://www.google.com/maps?cid=5281982118987187889&hl=id&output=embed";
// Cadangan kalau pin di atas belum pas (pakai koordinat):
// const MAP_EMBED = "https://www.google.com/maps?q=-6.236362,106.8233071&z=18&hl=id&output=embed";

// Halaman Kebijakan Privasi (diatur dari admin: Kelola Halaman Legal)
const PRIVACY_LINK = "/privacy";

// Tanda wajib diisi (bintang merah)
const Required = () => <span className="text-red-500">*</span>;

// Kotak abu-abu yang tampil selama data dari admin dimuat
const CardSkeleton = () => (
  <div className="space-y-2 animate-pulse">
    <div className="w-11/12 h-4 bg-gray-200 rounded"></div>
    <div className="w-2/3 h-4 bg-gray-200 rounded"></div>
  </div>
);

// Cek nomor telepon: hanya angka dan + - ( ), minimal 10 digit angka.
// Mengembalikan pesan error, atau "" kalau sudah sesuai.
const cekTelepon = (value) => {
  if (!value) return "";
  if (!/^[0-9+\-\s()]+$/.test(value)) {
    return "Nomor telepon hanya boleh berisi angka dan tanda + - ( ).";
  }
  if (value.replaceAll(/\D/g, "").length < 10) {
    return "Nomor telepon minimal 10 digit angka.";
  }
  return "";
};

// Pesan bawaan browser (Inggris) diganti bahasa Indonesia
const handleInvalid = (e) => {
  const el = e.target;
  if (el.validity.valueMissing) {
    el.setCustomValidity(
      el.type === "checkbox"
        ? "Centang persetujuan terlebih dahulu."
        : "Kolom ini wajib diisi."
    );
  } else if (el.validity.typeMismatch) {
    el.setCustomValidity("Format email tidak valid.");
  }
};

const Contact = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.resolvedLanguage || i18n.language || "id").startsWith("en")
    ? "en"
    : "id";
  const contact = useContactSettings(lang);

  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
      consentText:
        "Saya menyetujui Komite Akreditasi Nasional mengumpulkan dan memproses data pribadi saya untuk menanggapi pesan ini sesuai dengan",
      privacyLink: "Kebijakan Privasi",
    },
  };

  const t = content;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    // Hapus pesan error lama, lalu cek ulang khusus nomor telepon
    e.target.setCustomValidity(name === "phone" ? cekTelepon(value) : "");
  };

  const handleConsentChange = (e) => {
    setConsent(e.target.checked);
    e.target.setCustomValidity("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!consent) return;

    setSubmitting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ ...formData, consent }),
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
        setConsent(false);

        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
        return;
      }

      // Error validasi dari server: tampilkan di kolom yang bermasalah
      if (response.status === 422 && data.errors) {
        const [field, messages] = Object.entries(data.errors)[0];
        const el = formRef.current?.elements?.[field];
        if (el) {
          el.setCustomValidity(messages[0]);
          el.reportValidity();
          return;
        }
      }

      setErrorMsg(data.message || "Pesan gagal dikirim. Silakan coba lagi.");
    } catch (error) {
      console.error("Error submitting form:", error);
      setErrorMsg("Terjadi kesalahan. Silakan coba lagi nanti.");
    } finally {
      setSubmitting(false);
    }
  };

  const { loaded, address, hours, emails, phones } = contact;

  const linkClass = "block transition-colors hover:text-primary-600";

  const labelEl = (label) =>
    label ? (
      <span className="block text-xs font-semibold text-gray-400">
        {label}
      </span>
    ) : null;

  // ===== Isi kartu kontak =====
  // Masing-masing dibuat sebagai fungsi dengan if biasa
  // supaya tidak ada ternary bersarang.

  const renderAddress = () => {
    if (!loaded) return <CardSkeleton />;
    if (!address) return <span>-</span>;
    return (
      <a
        href={mapsLink(address)}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClass}
      >
        {address}
      </a>
    );
  };

  const renderPhones = () => {
    if (!loaded) return <CardSkeleton />;
    if (!phones.length) return <span>-</span>;
    return phones.map((p) => {
      const { href, isWa } = phoneLink(p.value);
      return (
        <div key={p.value}>
          {labelEl(p.label)}
          <a
            href={href}
            target={isWa ? "_blank" : undefined}
            rel={isWa ? "noopener noreferrer" : undefined}
            className={linkClass}
          >
            {p.value}
          </a>
        </div>
      );
    });
  };

  const renderEmails = () => {
    if (!loaded) return <CardSkeleton />;
    if (!emails.length) return <span>-</span>;
    return emails.map((m) => (
      <div key={m.value}>
        {labelEl(m.label)}
        <a
          href={gmailLink(m.value)}
          target="_blank"
          rel="noopener noreferrer"
          className={`${linkClass} break-all`}
        >
          {m.value}
        </a>
      </div>
    ));
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Alamat",
      titleEn: "Address",
      content: renderAddress(),
    },
    {
      icon: FaPhone,
      title: "Telepon",
      titleEn: "Phone",
      content: renderPhones(),
    },
    {
      icon: FaEnvelope,
      title: "Email",
      titleEn: "Email",
      content: renderEmails(),
    },
    {
      icon: FaClock,
      title: "Jam Operasional",
      titleEn: "Operating Hours",
      content: !loaded ? <CardSkeleton /> : <span>{hours || "-"}</span>,
    },
  ];

  const inputClass =
    "w-full px-4 py-3 transition-all border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent";

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
              {contactInfo.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="p-6 transition-all bg-white border border-gray-200 shadow-lg rounded-2xl hover:shadow-2xl hover:-translate-y-2 group"
                  >
                    {/* Icon */}
                    <div className="flex items-center justify-center w-16 h-16 mb-4 transition-transform shadow-lg rounded-xl group-hover:scale-110 bg-gradient-to-br from-primary-600 to-primary-700">
                      <Icon className="text-3xl text-white" />
                    </div>

                    <h3 className="mb-2 text-xl font-black text-gray-900">
                      {item.title}
                    </h3>

                    <div className="space-y-2 text-gray-600">
                      {item.content}
                    </div>
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

                {errorMsg && (
                  <div className="p-4 mb-6 border-2 border-red-500 bg-red-50 rounded-xl">
                    <p className="flex items-center gap-2 font-semibold text-red-800">
                      <FaExclamationCircle />
                      {errorMsg}
                    </p>
                  </div>
                )}

                <form
                  ref={formRef}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      {t.form.name} <Required />
                    </label>

                    <input
                      id="contact-name"
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      onInvalid={handleInvalid}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      {t.form.email} <Required />
                    </label>

                    <input
                      id="contact-email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onInvalid={handleInvalid}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      {t.form.phone} <Required />
                    </label>

                    <input
                      id="contact-phone"
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onInvalid={handleInvalid}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      {t.form.subject} <Required />
                    </label>

                    <input
                      id="contact-subject"
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onInvalid={handleInvalid}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block mb-2 text-sm font-bold text-gray-700"
                    >
                      {t.form.message} <Required />
                    </label>

                    <textarea
                      id="contact-message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      onInvalid={handleInvalid}
                      required
                      rows="6"
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {/* Persetujuan pemrosesan data pribadi (UU PDP) */}
                  <div className="flex items-start gap-3">
                    <input
                      id="persetujuan-pdp"
                      type="checkbox"
                      name="consent"
                      checked={consent}
                      onChange={handleConsentChange}
                      onInvalid={handleInvalid}
                      required
                      className="w-5 h-5 mt-1 border-2 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                    />
                    <label
                      htmlFor="persetujuan-pdp"
                      className="text-sm text-gray-600"
                    >
                      {t.form.consentText}{" "}
                      <a
                        href={PRIVACY_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold underline text-primary-700 hover:text-primary-900"
                      >
                        {t.form.privacyLink}
                      </a>
                      . <Required />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || !consent}
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
                    title="Lokasi Komite Akreditasi Nasional"
                    src={MAP_EMBED}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                </div>

                <a
                  href={MAP_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 font-bold transition-colors text-primary-700 hover:text-primary-900"
                >
                  <FaExternalLinkAlt className="text-sm" />
                  Buka di Google Maps
                </a>
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
