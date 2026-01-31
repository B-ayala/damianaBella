import { Outlet } from 'react-router-dom';
import TopNavBar from '../components/header/topNavBar/TopNavBar';
import NavBar from '../components/header/navBar/NavBar';

const ProtectedRoute = () => {
    return (
        <>
            <TopNavBar />
            <NavBar />
            <Outlet />
        </>
    );
};

export default ProtectedRoute;
