import { useState, useEffect } from 'react';
import { Trash2, RefreshCw } from 'lucide-react';
import { useAdminStore } from '../../store/adminStore';
import { getAdminUsers, deleteAdminUser, type AdminUserData } from '../../../services/userService';
import ConfirmationModal from '../../../components/common/Modal/ConfirmationModal';
import './Users.css';

const Users = () => {
    const currentUser = useAdminStore(state => state.currentUser);
    const [users, setUsers] = useState<AdminUserData[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [feedback, setFeedback] = useState<{
        isOpen: boolean;
        status: 'success' | 'error';
        title: string;
        message: string;
    }>({ isOpen: false, status: 'success', title: '', message: '' });

    const loadUsers = async () => {
        setIsLoading(true);
        setError('');
        try {
            const data = await getAdminUsers();
            setUsers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const filteredUsers = users.filter((u) => 
        (u.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDeleteUser = async (user: AdminUserData) => {
        if (currentUser && currentUser.id === user.id) {
            setFeedback({
                isOpen: true,
                status: 'error',
                title: 'Acción no permitida',
                message: 'No puedes eliminar tu propia cuenta.',
            });
            return;
        }

        if (!window.confirm(
            `¿Estás seguro de eliminar al usuario "${user.name || user.email}"?\n\nEsta acción eliminará la cuenta completamente y no se puede deshacer.`
        )) return;

        try {
            await deleteAdminUser(user.id);
            setUsers(prev => prev.filter(u => u.id !== user.id));
            setFeedback({
                isOpen: true,
                status: 'success',
                title: 'Usuario Eliminado',
                message: `El usuario "${user.name || user.email}" ha sido eliminado correctamente.`,
            });
        } catch (err) {
            setFeedback({
                isOpen: true,
                status: 'error',
                title: 'Error al Eliminar',
                message: err instanceof Error ? err.message : 'Error al eliminar el usuario',
            });
        }
    };

    const getEmailStatus = (user: AdminUserData) => {
        if (user.email_confirmed_at) {
            return { label: 'Verificado', className: 'verified' };
        }
        return { label: 'Pendiente de verificación', className: 'pending' };
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
                <button 
                    className="action-btn refresh" 
                    onClick={loadUsers} 
                    title="Recargar usuarios"
                    disabled={isLoading}
                >
                    <RefreshCw size={16} className={isLoading ? 'spinning' : ''} />
                </button>
            </div>

            {error && (
                <div className="admin-card error-card">
                    <p>{error}</p>
                    <button onClick={loadUsers} className="retry-btn">Reintentar</button>
                </div>
            )}

            <div className="admin-card table-card">
                {isLoading ? (
                    <div className="users-loading">
                        <div className="users-spinner"></div>
                        <p>Cargando usuarios...</p>
                    </div>
                ) : (
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Email</th>
                                    <th>Rol</th>
                                    <th>Estado Email</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-4 text-slate-500">
                                            No se encontraron usuarios.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => {
                                        const emailStatus = getEmailStatus(user);
                                        const isSelf = currentUser?.id === user.id;
                                        return (
                                            <tr key={user.id}>
                                                <td className="font-medium">{user.name || '—'}</td>
                                                <td>{user.email || '—'}</td>
                                                <td>
                                                    <span className={`role-badge ${user.role}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`email-status-badge ${emailStatus.className}`}>
                                                        {emailStatus.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="table-actions">
                                                        <button 
                                                            onClick={() => handleDeleteUser(user)}
                                                            className="action-btn delete"
                                                            title={isSelf ? 'No puedes eliminarte' : 'Eliminar usuario'}
                                                            disabled={isSelf}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={feedback.isOpen}
                onClose={() => setFeedback(prev => ({ ...prev, isOpen: false }))}
                status={feedback.status}
                title={feedback.title}
                message={feedback.message}
            />
        </div>
    );
};

export default Users;
