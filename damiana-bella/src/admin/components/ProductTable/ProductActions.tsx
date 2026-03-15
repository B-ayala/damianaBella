import { Edit, Trash2 } from 'lucide-react';
import type { AdminProduct } from '../../store/adminStore';

interface ProductActionsProps {
  product: AdminProduct;
  onEdit: (product: AdminProduct) => void;
  onDelete: (productId: string) => void;
}

export const ProductActions = ({ product, onEdit, onDelete }: ProductActionsProps) => {
  const handleDelete = () => {
    if (window.confirm('¿Eliminar producto?')) {
      onDelete(product.id);
    }
  };

  return (
    <div className="table-actions">
      <button onClick={() => onEdit(product)} className="action-btn edit" title="Editar">
        <Edit size={16} />
      </button>
      <button onClick={handleDelete} className="action-btn delete" title="Eliminar">
        <Trash2 size={16} />
      </button>
    </div>
  );
};
