import { supabase } from '../config/supabaseClient';
import { type AdminProduct } from '../admin/store/adminStore';
import type { Product } from '../types/product';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapDbRowToProduct = (row: any): Product => ({
  id: row.id,
  name: row.name,
  price: row.price,
  image: row.image_url || '',
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
});

const API_URL = import.meta.env.VITE_API_URL_LOCAL;

// Get Cloudinary signature for signed uploads
export const getCloudinarySignature = async () => {
  const response = await fetch(`${API_URL}/cloudinary/sign`, {
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

// Delete image from Cloudinary
export const deleteCloudinaryImage = async (publicId: string, token: string) => {
  const response = await fetch(`${API_URL}/cloudinary/delete`, {
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

// Fetch all products from Supabase
export const fetchProducts = async () => {
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
  const response = await fetch(`${API_URL}/products`, {
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
  const response = await fetch(`${API_URL}/products/${id}`, {
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
  const response = await fetch(`${API_URL}/products/${id}`, {
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
