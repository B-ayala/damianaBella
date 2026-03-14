import { Navigate, Outlet } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';

const AdminProtectedRoute = () => {
    const isAuthenticated = useAdminStore((state) => state.isAuthenticated);

    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default AdminProtectedRoute;
