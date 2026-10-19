// Kalau token admin kedaluwarsa (server membalas 401), hapus token
// dan arahkan ke halaman login. Berlaku untuk semua fetch() langsung
// ke endpoint admin, jadi halaman tidak perlu diubah satu-satu.
const originalFetch = window.fetch.bind(window);

window.fetch = async (...args) => {
  const response = await originalFetch(...args);

  try {
    const input = args[0];
    const url = typeof input === 'string' ? input : input?.url ?? '';
    const isAdminApi = url.includes('/api/v1/admin/');
    const onLoginPage = window.location.pathname.startsWith('/admin/login');

    if (response.status === 401 && isAdminApi && !onLoginPage) {
      localStorage.removeItem('token');
      window.location.href = '/admin/login';
    }
  } catch {
    // Kalau pengecekan gagal, jangan ganggu request aslinya
  }

  return response;
};