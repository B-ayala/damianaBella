import { create } from 'zustand';
import { loginUser, logoutUser } from '../../services/userService';
import type { Variant, Specification, FAQ } from '../../types/product';

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  description?: string;
  discount?: number;
  condition?: 'new' | 'used';
  freeShipping?: boolean;
  variants?: Variant[];
  specifications?: Specification[];
  features?: string[];
  faqs?: FAQ[];
  warranty?: string;
  returnPolicy?: string;
  status: 'active' | 'inactive';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export interface CarouselImage {
  id: string;
  url: string;
  order: number;
  isActive: boolean;
}

export interface AboutInfo {
  title: string;
  description: string;
  imageUrl: string;
  mission: string;
  vision: string;
  values: { title: string; description: string }[];
}

export interface FooterInfo {
  brandName: string;
  description: string;
  whatsapp: string;
  email: string;
  tiktokUser: string;
  tiktokUrl: string;
  facebookUser: string;
  facebookUrl: string;
  address: string;
  mapQuery: string;
  copyright: string;
}

interface AdminState {
  isAuthenticated: boolean;
  currentUser: { id: string; name: string; email: string; role: string } | null;
  products: AdminProduct[];
  users: AdminUser[];
  carouselImages: CarouselImage[];
  featuredProductIds: string[];
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => void;
  setCarouselImages: (images: CarouselImage[]) => void;
  addCarouselImage: (url: string) => void;
  updateCarouselImage: (id: string, data: Partial<CarouselImage>) => void;
  deleteCarouselImage: (id: string) => void;
  addFeaturedProduct: (id: string) => void;
  removeFeaturedProduct: (id: string) => void;
  setProducts: (products: AdminProduct[]) => void;
  addProduct: (product: AdminProduct) => void;
  updateProduct: (id: string, data: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  updateUser: (id: string, data: Partial<AdminUser>) => void;
  aboutInfo: AboutInfo;
  updateAboutInfo: (data: Partial<AboutInfo>) => void;
  footerInfo: FooterInfo;
  updateFooterInfo: (data: Partial<FooterInfo>) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isAuthenticated: false,
  currentUser: null,
  products: [],
  users: [],
  carouselImages: [],
  featuredProductIds: [],
  aboutInfo: { title: '', description: '', imageUrl: '', mission: '', vision: '', values: [] },
  footerInfo: {
    brandName: '',
    description: '',
    whatsapp: '',
    email: '',
    tiktokUser: '',
    tiktokUrl: '',
    facebookUser: '',
    facebookUrl: '',
    address: '',
    mapQuery: '',
    copyright: '',
  },
  login: async (email, pass) => {
    const response = await loginUser({ email, password: pass });
    console.log('[adminStore] loginUser response:', JSON.stringify(response));
    if (response.success && response.data) {
      const userData = {
        id: response.data.id || '',
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      };

      if (response.data.role === 'admin') {
        set({
          isAuthenticated: true,
          currentUser: userData
        });
        return true;
      } else {
        set({ currentUser: userData });
        return false;
      }
    }
    return false;
  },
  logout: async () => {
    await logoutUser();
    set({ isAuthenticated: false, currentUser: null });
  },
  setCarouselImages: (images) => set({ carouselImages: images }),
  addCarouselImage: (url) => set((state) => ({
    carouselImages: [...state.carouselImages, { id: Date.now().toString(), url, order: state.carouselImages.length + 1, isActive: true }]
  })),
  updateCarouselImage: (id, data) => set((state) => ({
    carouselImages: state.carouselImages.map(img => img.id === id ? { ...img, ...data } : img)
  })),
  deleteCarouselImage: (id) => set((state) => ({
    carouselImages: state.carouselImages.filter(img => img.id !== id)
  })),
  addFeaturedProduct: (id) => set((state) => ({
    featuredProductIds: [...state.featuredProductIds, id]
  })),
  removeFeaturedProduct: (id) => set((state) => ({
    featuredProductIds: state.featuredProductIds.filter(pid => pid !== id)
  })),
  setProducts: (products) => set({ products }),
  addProduct: (product) => set((state) => ({
    products: [...state.products, product]
  })),
  updateProduct: (id, data) => set((state) => ({
    products: state.products.map(p => p.id === id ? { ...p, ...data } : p)
  })),
  deleteProduct: (id) => set((state) => ({
    products: state.products.filter(p => p.id !== id)
  })),
  updateUser: (id, data) => set((state) => ({
    users: state.users.map(u => u.id === id ? { ...u, ...data } : u)
  })),
  updateAboutInfo: (data) => set((state) => ({
    aboutInfo: { ...state.aboutInfo, ...data }
  })),
  updateFooterInfo: (data) => set((state) => ({
    footerInfo: { ...state.footerInfo, ...data }
  }))
}));
