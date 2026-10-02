import { Link } from 'react-router-dom';
import { FaHome, FaSearch } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full blur-3xl opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-40" />
      </div>

      <div className="relative z-10 max-w-md w-full">
        {/* 404 number */}
        <div className="text-8xl font-black text-primary-600 leading-none mb-2 select-none">
          404
        </div>

        {/* Icon */}
        <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <FaSearch className="text-primary-500 text-3xl" />
        </div>

        {/* Text */}
        <h1 className="text-2xl font-black text-gray-900 mb-3">
          Halaman Tidak Ditemukan
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          Halaman yang Anda cari tidak tersedia atau mungkin telah dipindahkan.
          Periksa kembali URL atau kembali ke halaman utama.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-md"
          >
            <FaHome />
            Kembali ke Beranda
          </Link>
          <Link
            to="/kontak"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Hubungi Kami
          </Link>
        </div>

        {/* KAN branding */}
        <p className="text-xs text-gray-400 mt-10">
          Komite Akreditasi Nasional (KAN)
        </p>
      </div>
    </div>
  );
};

export default NotFound;
