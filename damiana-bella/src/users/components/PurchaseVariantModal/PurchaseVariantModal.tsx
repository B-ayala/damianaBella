import { useState, useEffect } from 'react';
import type { Product, Variant } from '../../../types/product';
import type { UnitVariants } from '../../../store/cartStore';
import { parseColorOption } from '../../../utils/constants';
import './PurchaseVariantModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (unitVariants: UnitVariants[]) => void;
  product: Product;
  quantity: number;
  initialVariants: UnitVariants;
}

const PurchaseVariantModal = ({ isOpen, onClose, onConfirm, product, quantity, initialVariants }: Props) => {
  const [mode, setMode] = useState<'ask' | 'custom'>('ask');
  const [perUnitVariants, setPerUnitVariants] = useState<UnitVariants[]>([]);

  useEffect(() => {
    if (isOpen) {
      setMode('ask');
      setPerUnitVariants(Array.from({ length: quantity }, () => ({ ...initialVariants })));
    }
  }, [isOpen, quantity, initialVariants]);

  if (!isOpen) return null;

  const variants = product.variants ?? [];

  const handleUnitVariantChange = (unitIndex: number, variantName: string, option: string) => {
    setPerUnitVariants(prev => {
      const updated = [...prev];
      updated[unitIndex] = { ...updated[unitIndex], [variantName]: option };
      return updated;
    });
  };

  return (
    <div className="pvm-overlay" onClick={onClose}>
      <div className="pvm-modal" onClick={(e) => e.stopPropagation()}>
        <button className="pvm-close" onClick={onClose}>✕</button>

        {mode === 'ask' ? (
          <>
            <h3 className="pvm-title">Selección de variantes</h3>
            <p className="pvm-subtitle">
              Estás comprando <strong>{quantity} unidades</strong>. ¿Querés aplicar el mismo color y talle a todas?
            </p>

            <div className="pvm-summary">
              {variants.map(v => {
                const selected = initialVariants[v.name];
                if (!selected) return null;
                const isColor = v.name.toLowerCase() === 'color';
                const { name: colorName, hex } = isColor
                  ? parseColorOption(selected)
                  : { name: selected, hex: '' };
                return (
                  <div key={v.name} className="pvm-summary-item">
                    <span className="pvm-summary-label">{v.name}:</span>
                    {isColor ? (
                      <span className="pvm-summary-color">
                        <span className="pvm-color-dot" style={{ backgroundColor: hex }} />
                        {colorName}
                      </span>
                    ) : (
                      <span className="pvm-summary-value">{selected.toUpperCase()}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pvm-actions">
              <button
                className="pvm-btn pvm-btn--primary"
                onClick={() => onConfirm(Array.from({ length: quantity }, () => ({ ...initialVariants })))}
              >
                Sí, aplicar a todas las unidades
              </button>
              <button className="pvm-btn pvm-btn--secondary" onClick={() => setMode('custom')}>
                No, personalizar por unidad
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="pvm-title">Configurar cada unidad</h3>
            <div className="pvm-units">
              {Array.from({ length: quantity }, (_, i) => (
                <div key={i} className="pvm-unit">
                  <p className="pvm-unit-title">Unidad {i + 1}</p>
                  {variants.map(v => (
                    <VariantSelector
                      key={v.name}
                      variant={v}
                      selected={perUnitVariants[i]?.[v.name] ?? ''}
                      onChange={(option) => handleUnitVariantChange(i, v.name, option)}
                    />
                  ))}
                </div>
              ))}
            </div>

            <div className="pvm-actions">
              <button className="pvm-btn pvm-btn--secondary" onClick={() => setMode('ask')}>
                Volver
              </button>
              <button className="pvm-btn pvm-btn--primary" onClick={() => onConfirm(perUnitVariants)}>
                Confirmar selección
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

interface VariantSelectorProps {
  variant: Variant;
  selected: string;
  onChange: (option: string) => void;
}

const VariantSelector = ({ variant, selected, onChange }: VariantSelectorProps) => {
  const isColor = variant.name.toLowerCase() === 'color';
  return (
    <div className="pvm-variant">
      <label className="pvm-variant-label">{variant.name}:</label>
      <div className="pvm-variant-options">
        {variant.options.map(option => {
          const { name: colorName, hex } = isColor
            ? parseColorOption(option)
            : { name: option, hex: '' };
          return isColor ? (
            <button
              key={option}
              className={`pvm-color-circle ${selected === option ? 'pvm-color-circle--selected' : ''}`}
              style={{ backgroundColor: hex }}
              title={colorName}
              onClick={() => onChange(option)}
            />
          ) : (
            <button
              key={option}
              className={`pvm-option-btn ${selected === option ? 'pvm-option-btn--selected' : ''}`}
              onClick={() => onChange(option)}
            >
              {variant.name.toLowerCase().startsWith('talle') ? option.toUpperCase() : option}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseVariantModal;
