import { supabase } from '../config/supabaseClient';
import { type AdminProduct } from '../admin/store/adminStore';
import type { Product } from '../types/product';
import { apiFetch } from '../utils/apiFetch';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapDbRowToProduct = (row: any): Product => {
  const images: string[] = row.images && row.images.length > 0
    ? row.images
    : row.image_url ? [row.image_url] : [];
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    image: images[0] || '',
    images,
    description: row.description,
    category: row.category,
    discount: row.discount,
    stock: row.stock,
    condition: row.condition,
    freeShipping: row.free_shipping,
    variants: row.variants,
    specifications: row.specifications,
    features: row.features,
    faqs: row.faqs,
    warranty: row.warranty,
    returnPolicy: row.return_policy,
  };
};

const API_URL = import.meta.env.VITE_API_URL_LOCAL;

// Get Cloudinary signature for signed uploads
export const getCloudinarySignature = async () => {
  const response = await apiFetch(`${API_URL}/cloudinary/sign`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error('Failed to get Cloudinary signature');
  }

  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || 'Failed to generate signature');
  }

  return data.data;
};

export interface CloudinaryFolder {
  name: string;
  path: string;
}

// Fetch folders at a given path (empty = root)
export const fetchCloudinaryFolders = async (token: string, path?: string): Promise<CloudinaryFolder[]> => {
  const url = path
    ? `${API_URL}/cloudinary/folders?path=${encodeURIComponent(path)}`
    : `${API_URL}/cloudinary/folders`;
  const response = await apiFetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) throw new Error('Failed to fetch folders');
  const data = await response.json();
  return (data.data?.folders ?? []) as CloudinaryFolder[];
};

// Create a new folder
export const createCloudinaryFolder = async (token: string, path: string): Promise<void> => {
  const response = await apiFetch(`${API_URL}/cloudinary/folders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) throw new Error('Failed to create folder');
};

// Delete a folder (must be empty)
export const deleteCloudinaryFolder = async (token: string, path: string): Promise<void> => {
  const response = await apiFetch(`${API_URL}/cloudinary/folders`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ path }),
  });
  if (!response.ok) throw new Error('Failed to delete folder');
};

// Fetch Cloudinary public config (cloudName, apiKey)
export const fetchCloudinaryConfig = async (): Promise<{ cloudName: string; apiKey: string }> => {
  const response = await apiFetch(`${API_URL}/cloudinary/config`);
  if (!response.ok) throw new Error('Failed to fetch Cloudinary config');
  const data = await response.json();
  return data.data;
};

// Fetch images from Cloudinary (admin only)
export const fetchCloudinaryImages = async (token: string, folder?: string, nextCursor?: string) => {
  let url = `${API_URL}/cloudinary/images`;
  const params = new URLSearchParams();
  if (folder) params.set('folder', folder);
  if (nextCursor) params.set('next_cursor', nextCursor);
  if (params.toString()) url += `?${params.toString()}`;

  const response = await apiFetch(url, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch Cloudinary images');
  const data = await response.json();
  return data.data as { resources: CloudinaryResource[]; next_cursor?: string };
};

export interface CloudinaryResource {
  public_id: string;
  secure_url: string;
  format: string;
  bytes: number;
  created_at: string;
  width: number;
  height: number;
}

// Delete image from Cloudinary
export const deleteCloudinaryImage = async (publicId: string, token: string) => {
  const response = await apiFetch(`${API_URL}/cloudinary/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ publicId }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete image from Cloudinary');
  }

  return response.json();
};

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  level: number;
}

// Fetch full category tree from the categories table
export const fetchCategoriesTree = async (): Promise<Category[]> => {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, parent_id, level')
    .order('level', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    // Table may not exist yet — return empty silently
    console.warn('fetchCategoriesTree:', error.message);
    return [];
  }

  return (data ?? []) as Category[];
};

// Create a new category (or subcategory if parentId is provided)
export const createCategory = async (
  name: string,
  parentId: string | null,
  level: number
): Promise<Category> => {
  const slug = name
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug, parent_id: parentId, level })
    .select('id, name, slug, parent_id, level')
    .single();
  if (error) throw new Error(error.message);
  return data as Category;
};

// Delete a category (cascades to subcategories via ON DELETE CASCADE)
export const deleteCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
};

// Fetch level-1 category names (used by NavBar dropdown)
// Falls back to reading from productos if categories table is not set up yet
export const fetchCategories = async (): Promise<string[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('name')
      .eq('level', 1)
      .order('name', { ascending: true });

    if (!error && data && data.length > 0) {
      return data.map((c) => c.name) as string[];
    }
  } catch {
    // fall through to fallback
  }

  // Fallback: derive unique categories from productos table
  const { data, error } = await supabase
    .from('productos')
    .select('category')
    .eq('status', 'active');

  if (error) {
    console.error('Fetch categories error:', error);
    throw error;
  }

  const categories = [...new Set(data?.map((p) => p.category).filter(Boolean))] as string[];
  return categories.sort();
};

// Fetch featured products from Supabase (for home page)
export const fetchFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('featured', true)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch featured products error:', error);
    throw error;
  }

  return data || [];
};

// Toggle product featured status in Supabase
export const toggleProductFeatured = async (id: string, featured: boolean) => {
  const { error } = await supabase
    .from('productos')
    .update({ featured })
    .eq('id', id);

  if (error) {
    console.error('Toggle featured error:', error);
    throw error;
  }
};

// Fetch all products from Supabase (admin — includes inactive)
export const fetchAllProducts = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch products error:', error);
    throw error;
  }

  return data || [];
};

// Fetch all products from Supabase (only active)
export const fetchProducts = async () => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Fetch products error:', error);
    throw error;
  }

  return data || [];
};

// Fetch single product
export const fetchProductById = async (id: string) => {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Fetch product error:', error);
    throw error;
  }

  return data;
};

// Create product via backend API
export const createProduct = async (
  product: Omit<AdminProduct, 'id'>,
  token: string
) => {
  const response = await apiFetch(`${API_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl,
      publicId: product.imageUrl ? product.imageUrl.split('/').pop() : '',
      description: product.description,
      discount: product.discount,
      condition: product.condition,
      freeShipping: product.freeShipping,
      variants: product.variants,
      specifications: product.specifications,
      features: product.features,
      faqs: product.faqs,
      warranty: product.warranty,
      returnPolicy: product.returnPolicy,
      status: product.status,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create product');
  }

  return response.json();
};

// Update product via backend API
export const updateProduct = async (
  id: string,
  product: Partial<AdminProduct>,
  token: string
) => {
  const response = await apiFetch(`${API_URL}/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      name: product.name,
      price: product.price,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl,
      publicId: product.imageUrl ? product.imageUrl.split('/').pop() : '',
      description: product.description,
      discount: product.discount,
      condition: product.condition,
      freeShipping: product.freeShipping,
      variants: product.variants,
      specifications: product.specifications,
      features: product.features,
      faqs: product.faqs,
      warranty: product.warranty,
      returnPolicy: product.returnPolicy,
      status: product.status,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }

  return response.json();
};

// Delete product (via backend - also deletes from Cloudinary)
export const deleteProduct = async (id: string, token: string) => {
  const response = await apiFetch(`${API_URL}/products/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }

  return response.json();
};

// ── Carousel Images ──────────────────────────────────────────────────────────

export interface CarouselImageRow {
  id: string;
  url: string;
  order: number;
  isActive: boolean;
}

const mapCarouselRow = (row: Record<string, unknown>): CarouselImageRow => ({
  id: row.id as string,
  url: row.url as string,
  order: row.order as number,
  isActive: row.is_active as boolean,
});

// Fetch active images (user-facing)
export const fetchCarouselImages = async (): Promise<CarouselImageRow[]> => {
  const { data, error } = await supabase
    .from('carousel_images')
    .select('*')
    .eq('is_active', true)
    .order('order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCarouselRow);
};

// Fetch all images (admin)
export const fetchAllCarouselImages = async (): Promise<CarouselImageRow[]> => {
  const { data, error } = await supabase
    .from('carousel_images')
    .select('*')
    .order('order', { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCarouselRow);
};

export const insertCarouselImage = async (url: string, order: number): Promise<CarouselImageRow> => {
  const { data, error } = await supabase
    .from('carousel_images')
    .insert([{ url, order, is_active: true }])
    .select()
    .single();
  if (error) throw error;
  return mapCarouselRow(data);
};

export const updateCarouselImageDb = async (
  id: string,
  changes: { url?: string; order?: number; is_active?: boolean }
): Promise<void> => {
  const { error } = await supabase
    .from('carousel_images')
    .update(changes)
    .eq('id', id);
  if (error) throw error;
};

export const deleteCarouselImageDb = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('carousel_images')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const reorderCarouselImages = async (images: { id: string; order: number }[]): Promise<void> => {
  await Promise.all(
    images.map(img =>
      supabase.from('carousel_images').update({ order: img.order }).eq('id', img.id)
    )
  );
};

// Direct Supabase methods (for client-side operations if needed)
export const supabaseProducts = {
  async getAll() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async insert(product: Omit<AdminProduct, 'id'>) {
    const { data, error } = await supabase
      .from('productos')
      .insert([
        {
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category,
          image_url: product.imageUrl,
          public_id: product.imageUrl ? product.imageUrl.split('/').pop() : '',
          description: product.description,
          discount: product.discount,
          condition: product.condition,
          free_shipping: product.freeShipping,
          variants: product.variants,
          specifications: product.specifications,
          features: product.features,
          faqs: product.faqs,
          warranty: product.warranty,
          return_policy: product.returnPolicy,
          status: product.status,
        },
      ])
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async update(id: string, product: Partial<AdminProduct>) {
    const updateData: Record<string, unknown> = {};
    if (product.name) updateData.name = product.name;
    if (product.price) updateData.price = product.price;
    if (product.stock !== undefined) updateData.stock = product.stock;
    if (product.category) updateData.category = product.category;
    if (product.imageUrl) updateData.image_url = product.imageUrl;
    if (product.description !== undefined) updateData.description = product.description;
    if (product.discount !== undefined) updateData.discount = product.discount;
    if (product.condition) updateData.condition = product.condition;
    if (product.freeShipping !== undefined) updateData.free_shipping = product.freeShipping;
    if (product.variants !== undefined) updateData.variants = product.variants;
    if (product.specifications !== undefined) updateData.specifications = product.specifications;
    if (product.features !== undefined) updateData.features = product.features;
    if (product.faqs !== undefined) updateData.faqs = product.faqs;
    if (product.warranty !== undefined) updateData.warranty = product.warranty;
    if (product.returnPolicy !== undefined) updateData.return_policy = product.returnPolicy;
    if (product.status) updateData.status = product.status;

    const { data, error } = await supabase
      .from('productos')
      .update(updateData)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data?.[0];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
