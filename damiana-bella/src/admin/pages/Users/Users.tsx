import { useState } from 'react';
import { Edit, Power, PowerOff } from 'lucide-react';
import { useAdminStore, type AdminUser } from '../../store/adminStore';
import './Users.css';

const Users = () => {
    const { users, updateUser } = useAdminStore();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter((u) => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleStatus = (user: AdminUser) => {
        const newStatus = user.status === 'active' ? 'inactive' : 'active';
        if (window.confirm(`¿Seguro que deseas ${newStatus === 'active' ? 'activar' : 'desactivar'} el usuario ${user.name}?`)) {
            updateUser(user.id, { status: newStatus });
        }
    };

    return (
        <div className="admin-users-page">
            <div className="admin-page-header">
                <h1 className="admin-page-title">Usuarios</h1>
                <p className="admin-page-subtitle">Administra los usuarios del sistema.</p>
            </div>

            <div className="admin-card users-toolbar">
                <div className="search-input-wrapper admin-w-full admin-max-w-md">
                    <input 
                        type="text" 
                        placeholder="Buscar usuario por nombre o email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="admin-card table-card">
                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-4 text-slate-500">No se encontraron usuarios.</td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id}>
                                        <td className="font-medium">{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge ${user.role}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.status}`}>
                                                {user.status === 'active' ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="table-actions">
                                                <button className="action-btn edit" title="Editar (Próximamente)">
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleToggleStatus(user)} 
                                                    className={`action-btn ${user.status === 'active' ? 'delete' : 'activate'}`} 
                                                    title={user.status === 'active' ? 'Desactivar' : 'Activar'}
                                                >
                                                    {user.status === 'active' ? <PowerOff size={16} /> : <Power size={16} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Users;
