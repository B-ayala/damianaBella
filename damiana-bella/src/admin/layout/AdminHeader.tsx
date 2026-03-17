import { Menu, UserCircle } from 'lucide-react';
import { useAdminStore } from '../store/adminStore';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
    const currentUser = useAdminStore(state => state.currentUser);

    return (
        <header className="admin-header">
            <button className="admin-menu-toggle" onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            <div className="admin-header-right">
                <div className="admin-user-info">
                    <UserCircle size={24} />
                    <span>{currentUser?.name ?? 'Admin'}</span>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
