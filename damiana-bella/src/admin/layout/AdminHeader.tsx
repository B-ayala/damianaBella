import { Menu, UserCircle } from 'lucide-react';
import './AdminHeader.css';

const AdminHeader = ({ toggleSidebar }: { toggleSidebar: () => void }) => {
    return (
        <header className="admin-header">
            <button className="admin-menu-toggle" onClick={toggleSidebar}>
                <Menu size={24} />
            </button>
            <div className="admin-header-right">
                <div className="admin-user-info">
                    <UserCircle size={24} />
                    <span>Lia Admin</span>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;
