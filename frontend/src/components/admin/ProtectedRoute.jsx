import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, roles }) => {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/admin/login" replace />;
  }

  if (roles) {
    let user;
    try {
      user = JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      user = null;
    }

    const role = user?.role === 'sosmed_admin' ? 'adminsosmed' : user?.role;
    if (!roles.includes(role)) {
      return <Navigate to={user ? '/admin/dashboard' : '/admin/login'} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
