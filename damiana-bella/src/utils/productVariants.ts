import type { Product, Variant } from '../types/product';

export type SelectedVariants = Record<string, string>;

export const isSizeVariant = (variantName: string): boolean =>
  variantName.trim().toLowerCase().startsWith('talle');

export const normalizeVariantOption = (variantName: string, option: string): string => {
  const trimmed = option.trim();

  if (!trimmed) {
    return '';
  }

  return isSizeVariant(variantName) ? trimmed.toUpperCase() : trimmed;
};

export const getNormalizedVariantOptions = (variantName: string, options: string[]): string[] =>
  options
    .map((option) => normalizeVariantOption(variantName, option))
    .filter(Boolean)
    .filter((option, index, list) => list.indexOf(option) === index);

export const sanitizeVariant = (variant: Variant): Variant => {
  const name = variant.name.trim();
  const options = getNormalizedVariantOptions(name, variant.options ?? []);

  if (!isSizeVariant(name)) {
    return {
      ...variant,
      name,
      options,
      stockByOption: undefined,
    };
  }

  const stockByOption = options.reduce<Record<string, number>>((acc, option) => {
    const rawStock = variant.stockByOption?.[option];
    acc[option] = Number.isFinite(rawStock) ? Math.max(0, rawStock ?? 0) : 0;
    return acc;
  }, {});

  return {
    ...variant,
    name,
    options,
    stockByOption,
  };
};

export const sanitizeProductVariants = (variants?: Variant[] | null): Variant[] | undefined => {
  if (!variants || variants.length === 0) {
    return undefined;
  }

  const sanitized = variants
    .map(sanitizeVariant)
    .filter((variant) => variant.name && variant.options.length > 0);

  return sanitized.length > 0 ? sanitized : undefined;
};

export const getVariantOptionStock = (variant: Variant, option: string): number | undefined => {
  if (!isSizeVariant(variant.name)) {
    return undefined;
  }

  const normalizedOption = normalizeVariantOption(variant.name, option);
  const rawStock = variant.stockByOption?.[normalizedOption];

  if (!Number.isFinite(rawStock)) {
    return undefined;
  }

  return Math.max(0, rawStock ?? 0);
};

export const isVariantOptionAvailable = (variant: Variant, option: string): boolean => {
  const optionStock = getVariantOptionStock(variant, option);
  return optionStock === undefined || optionStock > 0;
};

export const getProductStockFromVariants = (variants?: Variant[] | null): number | undefined => {
  const sizeVariant = sanitizeProductVariants(variants)?.find((variant) => isSizeVariant(variant.name));

  if (!sizeVariant?.stockByOption) {
    return undefined;
  }

  return Object.values(sizeVariant.stockByOption).reduce((total, optionStock) => total + optionStock, 0);
};

export const sanitizeSelectedVariants = (product: Product, selectedVariants: SelectedVariants): SelectedVariants => {
  const variants = sanitizeProductVariants(product.variants) ?? [];

  return variants.reduce<SelectedVariants>((acc, variant) => {
    const selected = selectedVariants[variant.name];
    const normalizedSelection = normalizeVariantOption(variant.name, selected ?? '');

    if (!normalizedSelection) {
      return acc;
    }

    if (!variant.options.includes(normalizedSelection)) {
      return acc;
    }

    if (!isVariantOptionAvailable(variant, normalizedSelection)) {
      return acc;
    }

    acc[variant.name] = normalizedSelection;
    return acc;
  }, {});
};

export const getMissingVariantSelections = (product: Product, selectedVariants: SelectedVariants): string[] => {
  const variants = sanitizeProductVariants(product.variants) ?? [];
  const sanitizedSelections = sanitizeSelectedVariants(product, selectedVariants);

  return variants
    .filter((variant) => !sanitizedSelections[variant.name])
    .map((variant) => variant.name);
};

export const getInvalidVariantSelections = (product: Product, selectedVariants: SelectedVariants): string[] => {
  const variants = sanitizeProductVariants(product.variants) ?? [];

  return variants
    .filter((variant) => {
      const selected = selectedVariants[variant.name];

      if (!selected) {
        return false;
      }

      const normalizedSelection = normalizeVariantOption(variant.name, selected);
      return !normalizedSelection || !variant.options.includes(normalizedSelection) || !isVariantOptionAvailable(variant, normalizedSelection);
    })
    .map((variant) => variant.name);
};

export const areUnitVariantSelectionsValid = (product: Product, unitVariants: SelectedVariants[]): boolean => {
  const variants = sanitizeProductVariants(product.variants) ?? [];

  if (variants.length === 0) {
    return true;
  }

  if (unitVariants.length === 0) {
    return false;
  }

  return unitVariants.every((selection) => {
    const sanitized = sanitizeSelectedVariants(product, selection);
    return variants.every((variant) => Boolean(sanitized[variant.name]));
  });
};