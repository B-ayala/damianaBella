import { Outlet } from 'react-router-dom';
import TopNavBar from '../components/header/topNavBar/TopNavBar';
import NavBar from '../components/header/navBar/NavBar';

const ProtectedRoute = () => {
    return (
        <>
            <div style={{ position: 'sticky', top: 0, zIndex: 9999, width: '100%' }}>
                <TopNavBar />
                <NavBar />
            </div>
            <Outlet />
        </>
    );
};

export default ProtectedRoute;
