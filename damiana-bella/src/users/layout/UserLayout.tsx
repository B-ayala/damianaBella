import { Outlet } from 'react-router-dom';
import TopNavBar from '../components/header/topNavBar/TopNavBar';
import NavBar from '../components/header/navBar/NavBar';
import { useNavigationLoad } from '../../components/common/NavigationLoad/NavigationLoadProvider';
import NavigationLoadingScreen from '../../components/common/NavigationLoad/NavigationLoadingScreen';

const UserLayout = () => {
    const { isNavigationLoading } = useNavigationLoad();

    return (
        <>
            <div style={{ position: 'sticky', top: 0, zIndex: 200, width: '100%' }}>
                <TopNavBar />
                <NavBar />
            </div>
            <div style={{ position: 'relative', minHeight: '100vh' }}>
                {isNavigationLoading && <NavigationLoadingScreen />}
                <Outlet />
            </div>
        </>
    );
};

export default UserLayout;
