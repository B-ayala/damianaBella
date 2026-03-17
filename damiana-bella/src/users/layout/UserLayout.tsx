import { Outlet } from 'react-router-dom';
import TopNavBar from '../components/header/topNavBar/TopNavBar';
import NavBar from '../components/header/navBar/NavBar';

const UserLayout = () => {
    return (
        <>
            <div style={{ position: 'sticky', top: 0, zIndex: 200, width: '100%' }}>
                <TopNavBar />
                <NavBar />
            </div>
            <Outlet />
        </>
    );
};

export default UserLayout;
