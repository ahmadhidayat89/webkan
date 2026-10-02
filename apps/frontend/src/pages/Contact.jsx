import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SEO from "../components/SEO";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
  FaPaperPlane,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaLinkedinIn,
} from "react-icons/fa";

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || "";
const RECAPTCHA_ENABLED =
  import.meta.env.VITE_RECAPTCHA_ENABLED === "true" && !!RECAPTCHA_SITE_KEY;
const RECAPTCHA_SCRIPT_ID = "google-recaptcha-script";
const PHONE_REGEX = /^\+?[0-9][0-9\s().-]{6,24}$/;
const NAME_REGEX = /^[\p{L}\s'.-]+$/u;
const FORBIDDEN_INPUT_PATTERN = /<\?(?:php|=)?|<\s*script\b|<\/script>|javascript\s*:|on[a-z]+\s*=/i;

const SOCIAL_PLATFORMS = [
  { key: "social_facebook", icon: FaFacebook, label: "Facebook", bg: "bg-blue-600", hover: "hover:bg-blue-700" },
  { key: "social_twitter", icon: FaTwitter, label: "Twitter/X", bg: "bg-sky-500", hover: "hover:bg-sky-600" },
  { key: "social_instagram", icon: FaInstagram, label: "Instagram", bg: "bg-gradient-to-br from-pink-500 to-orange-400", hover: "hover:opacity-90" },
  { key: "social_youtube", icon: FaYoutube, label: "YouTube", bg: "bg-red-600", hover: "hover:bg-red-700" },
  { key: "social_tiktok", icon: FaTiktok, label: "TikTok", bg: "bg-gray-900", hover: "hover:bg-black" },
  { key: "social_linkedin", icon: FaLinkedinIn, label: "LinkedIn", bg: "bg-blue-700", hover: "hover:bg-blue-800" },
];

const DEFAULT_MAPS_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.6664849803897!2d106.82288931476895!3d-6.176104995527208!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f42b33e1b4c3%3A0x7a6e6f7a6f7a6f7a!2sGedung%20BPPT%20I!5e0!3m2!1sen!2sid!4v1234567890123!5m2!1sen!2sid";

const initialFormState = {
  name: "",
  email: "",
  phone: "",
  message: "",
  website: "",
};

const trimFormValues = (values) => ({
  ...values,
  name: values.name.trim(),
  email: values.email.trim().toLowerCase(),
  phone: values.phone.trim(),
  message: values.message.trim(),
  website: values.website.trim(),
});

const countWords = (value) => value.trim().split(/\s+/).filter(Boolean).length;
const hasForbiddenPattern = (value) => FORBIDDEN_INPUT_PATTERN.test(value || "");

const validateForm = (values, token) => {
  const errors = {};

  if (!values.name) {
    errors.name = "Nama wajib diisi.";
  } else if (values.name.length < 3 || values.name.length > 100) {
    errors.name = "Nama harus 3-100 karakter.";
  } else if (!NAME_REGEX.test(values.name)) {
    errors.name = "Nama hanya boleh berisi huruf, spasi, apostrof, titik, dan tanda hubung.";
  } else if (hasForbiddenPattern(values.name)) {
    errors.name = "Input mengandung pola yang tidak diizinkan.";
  }

  if (!values.email) {
    errors.email = "Email wajib diisi.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Format email tidak valid.";
  } else if (hasForbiddenPattern(values.email)) {
    errors.email = "Input mengandung pola yang tidak diizinkan.";
  }

  if (values.phone && !PHONE_REGEX.test(values.phone)) {
    errors.phone = "Format nomor telepon tidak valid.";
  } else if (values.phone && hasForbiddenPattern(values.phone)) {
    errors.phone = "Input mengandung pola yang tidak diizinkan.";
  }

  if (!values.message) {
    errors.message = "Pesan wajib diisi.";
  } else if (values.message.length < 20 || values.message.length > 2000) {
    errors.message = "Pesan harus 20-2000 karakter.";
  } else if (countWords(values.message) < 3) {
    errors.message = "Pesan minimal 3 kata.";
  } else if (hasForbiddenPattern(values.message)) {
    errors.message = "Input mengandung pola yang tidak diizinkan.";
  }

  if (RECAPTCHA_ENABLED && !token) {
    errors.recaptcha = "Selesaikan verifikasi keamanan terlebih dahulu.";
  }

  return errors;
};

const Contact = () => {
  const [mapsUrl, setMapsUrl] = useState(DEFAULT_MAPS_URL);
  const [socialLinks, setSocialLinks] = useState({});

  const [formData, setFormData] = useState(initialFormState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const [recaptchaReady, setRecaptchaReady] = useState(false);
  const formStartedAtRef = useRef(Math.floor(Date.now() / 1000));
  const recaptchaContainerRef = useRef(null);
  const recaptchaWidgetIdRef = useRef(null);
  const submitLockRef = useRef(false);

  useEffect(() => {
    fetch("/api/v1/settings?group=contact")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data?.maps_embed) {
          setMapsUrl(data.data.maps_embed);
        }
      })
      .catch(() => {});

    fetch("/api/v1/settings?group=social")
      .then((r) => r.json())
      .then((data) => {
        if (data.success && data.data) setSocialLinks(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!RECAPTCHA_ENABLED) return;

    const renderWidget = () => {
      if (!window.grecaptcha || !recaptchaContainerRef.current) return;
      if (recaptchaWidgetIdRef.current !== null) return;

      recaptchaWidgetIdRef.current = window.grecaptcha.render(recaptchaContainerRef.current, {
        sitekey: RECAPTCHA_SITE_KEY,
        callback: (token) => {
          setRecaptchaToken(token);
          setErrors((prev) => ({ ...prev, recaptcha: undefined }));
        },
        "expired-callback": () => setRecaptchaToken(""),
        "error-callback": () => setRecaptchaToken(""),
      });
      setRecaptchaReady(true);
    };

    const existingScript = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (existingScript) {
      if (window.grecaptcha) {
        renderWidget();
      } else {
        existingScript.addEventListener("load", renderWidget, { once: true });
      }
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = "https://www.google.com/recaptcha/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", renderWidget, { once: true });
    document.head.appendChild(script);
  }, []);

  const activeSocials = useMemo(
    () => SOCIAL_PLATFORMS.filter((p) => socialLinks[p.key]?.trim()),
    [socialLinks]
  );

  const content = {
    title: "Hubungi Kami",
    subtitle: "Kami siap membantu Anda",
    form: {
      name: "Nama Lengkap",
      email: "Email",
      phone: "Nomor Telepon",
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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const resetRecaptcha = () => {
    if (window.grecaptcha && recaptchaWidgetIdRef.current !== null) {
      window.grecaptcha.reset(recaptchaWidgetIdRef.current);
    }
    setRecaptchaToken("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitLockRef.current || submitting) return;
    submitLockRef.current = true;

    const cleaned = trimFormValues(formData);
    const validationErrors = validateForm(cleaned, recaptchaToken);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      submitLockRef.current = false;
      return;
    }

    setSubmitting(true);
    setErrors({});

    try {
      const response = await fetch("/api/v1/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...cleaned,
          recaptcha_token: RECAPTCHA_ENABLED ? recaptchaToken : "",
          form_started_at: formStartedAtRef.current,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data?.errors) {
          setErrors((prev) => ({
            ...prev,
            ...Object.fromEntries(
              Object.entries(data.errors).map(([key, value]) => [
                key === "recaptcha_token" ? "recaptcha" : key,
                Array.isArray(value) ? value[0] : value,
              ])
            ),
          }));
        }
        throw new Error(data?.message || `HTTP ${response.status}`);
      }

      if (data.success) {
        setSubmitted(true);
        setFormData(initialFormState);
        formStartedAtRef.current = Math.floor(Date.now() / 1000);
        resetRecaptcha();

        setTimeout(() => {
          setSubmitted(false);
        }, 5000);
      } else {
        toast.error(data.message || "Gagal mengirim pesan. Silakan coba lagi.");
      }
    } catch (error) {
      toast.error(error.message || "Terjadi kesalahan. Silakan coba beberapa saat lagi.");
    } finally {
      setSubmitting(false);
      submitLockRef.current = false;
    }
  };

  const contactInfo = [
    {
      icon: FaMapMarkerAlt,
      title: "Alamat",
      titleEn: "Address",
      content: t.info.address,
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: FaPhone,
      title: "Telepon",
      titleEn: "Phone",
      content: t.info.phone,
      color: "from-green-500 to-green-600",
    },
    {
      icon: FaEnvelope,
      title: "Email",
      titleEn: "Email",
      content: t.info.email,
      color: "from-purple-500 to-purple-600",
    },
    {
      icon: FaClock,
      title: "Jam Operasional",
      titleEn: "Operating Hours",
      content: t.info.hours,
      color: "from-orange-500 to-orange-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Kontak"
        description="Hubungi Komite Akreditasi Nasional (KAN) untuk informasi lebih lanjut mengenai layanan akreditasi."
      />
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
            <p className="text-xl md:text-2xl text-white/90">{t.subtitle}</p>
          </div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactInfo.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-2xl hover:-translate-y-2 transition-all group"
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}
                    >
                      <Icon className="text-3xl text-white" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">
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

      {/* Social Media - hanya tampil jika ada yang diisi */}
      {activeSocials.length > 0 && (
        <section className="pb-4 pt-0">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-black text-gray-900 mb-5">Ikuti Kami</h2>
              <div className="flex flex-wrap gap-3">
                {activeSocials.map((p) => {
                  const Icon = p.icon;
                  return (
                    <a
                      key={p.key}
                      href={socialLinks[p.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 px-5 py-3 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg ${p.bg} ${p.hover}`}
                    >
                      <Icon size={16} />
                      {p.label}
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Form & Map */}
      <section className="py-14 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-7">
                  Kirim Pesan
                </h2>

                {submitted && (
                  <div className="mb-6 p-4 bg-green-50 border-2 border-green-500 rounded-xl">
                    <p className="text-green-800 font-semibold flex items-center gap-2">
                      <FaPaperPlane />
                      {t.form.success}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  <div>
                    <label className="block text-base font-extrabold text-gray-800 mb-2">
                      {t.form.name} *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-extrabold text-gray-800 mb-2">
                      {t.form.email} *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-extrabold text-gray-800 mb-2">
                      {t.form.phone}
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    />
                    {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-base font-extrabold text-gray-800 mb-2">
                      {t.form.message} *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="5"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                    />
                    {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message}</p>}
                  </div>

                  <div
                    style={{
                      position: "absolute",
                      left: "-9999px",
                      top: "-9999px",
                    }}
                    aria-hidden="true"
                  >
                    <label htmlFor="website">Website</label>
                    <input
                      type="text"
                      id="website"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      tabIndex="-1"
                      autoComplete="off"
                    />
                  </div>

                  <div>
                    {RECAPTCHA_ENABLED ? (
                      <>
                        <div ref={recaptchaContainerRef}></div>
                        {errors.recaptcha && (
                          <p className="text-xs text-red-600 mt-1">{errors.recaptcha}</p>
                        )}
                      </>
                    ) : null}
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (RECAPTCHA_ENABLED && !recaptchaReady)}
                    className="w-full flex items-center justify-center gap-3 px-8 py-3.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-base md:text-lg hover:scale-105 transition-all shadow-lg hover:shadow-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-7">
                  Lokasi Kami
                </h2>
                <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-gray-200 h-[520px]">
                  <iframe
                    src={mapsUrl}
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
