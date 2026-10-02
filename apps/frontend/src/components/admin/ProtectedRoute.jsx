import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { getMe } from '../../services/api';

/**
 * roles: array of allowed roles, e.g. ['super_admin', 'sosmed_admin']
 * Jika tidak diisi, semua role yang sudah login diizinkan.
 * Auth status ditentukan oleh httpOnly cookie — tidak perlu cek localStorage.
 */
const ProtectedRoute = ({ children, roles }) => {
  const [status, setStatus] = useState(null); // null | 'ok' | 'unauth' | 'forbidden'

  useEffect(() => {
    getMe()
      .then(res => {
        const user = res.data?.data;
        if (roles && roles.length > 0 && !roles.includes(user?.role)) {
          setStatus('forbidden');
        } else {
          setStatus('ok');
        }
      })
      .catch(() => {
        setStatus('unauth');
      });
  }, []);

  if (status === null) return null;
  if (status === 'unauth') return <Navigate to="/admin/login" replace />;
  if (status === 'forbidden') return <Navigate to="/admin/dashboard" replace />;

  return children;
};

export default ProtectedRoute;
