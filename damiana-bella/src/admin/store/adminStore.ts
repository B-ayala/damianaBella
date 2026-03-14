import { create } from 'zustand';

import pantalonImg from '../../assets/products/pantalon.jpeg';
import saquitoImg from '../../assets/products/saquito.png';
import saquito2Img from '../../assets/products/saquito2.png';
import saquitocompletoImg from '../../assets/products/saquitocompleto.png';
import saquitocompleto1Img from '../../assets/products/saquitocompleto1.png';
import saquitocompleto2Img from '../../assets/products/saquitocompleto2.png';

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: string;
  hasPromo: boolean;
  promoPrice?: number;
  imageUrl: string;
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
  products: AdminProduct[];
  users: AdminUser[];
  carouselImages: CarouselImage[];
  featuredProductIds: string[];
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  setCarouselImages: (images: CarouselImage[]) => void;
  addCarouselImage: (url: string) => void;
  updateCarouselImage: (id: string, data: Partial<CarouselImage>) => void;
  deleteCarouselImage: (id: string) => void;
  addFeaturedProduct: (id: string) => void;
  removeFeaturedProduct: (id: string) => void;
  deleteProduct: (id: string) => void;
  updateUser: (id: string, data: Partial<AdminUser>) => void;
  aboutInfo: AboutInfo;
  updateAboutInfo: (data: Partial<AboutInfo>) => void;
  footerInfo: FooterInfo;
  updateFooterInfo: (data: Partial<FooterInfo>) => void;
}

const mockProducts: AdminProduct[] = [
  { id: '1', name: 'Saquito Tejido Artesanal', price: 15000, stock: 12, category: 'Indumentaria', hasPromo: false, imageUrl: saquitoImg, status: 'active' },
  { id: '2', name: 'Saquito Elegante', price: 4500, stock: 2, category: 'Indumentaria', hasPromo: true, promoPrice: 3500, imageUrl: saquito2Img, status: 'active' },
  { id: '3', name: 'Pantalón Clásico', price: 22000, stock: 0, category: 'Indumentaria', hasPromo: false, imageUrl: pantalonImg, status: 'inactive' },
  { id: '4', name: 'Saquito Completo Premium', price: 35000, stock: 5, category: 'Indumentaria', hasPromo: true, promoPrice: 30000, imageUrl: saquitocompletoImg, status: 'active' },
  { id: '5', name: 'Conjunto Completo Clásico', price: 28000, stock: 8, category: 'Indumentaria', hasPromo: false, imageUrl: saquitocompleto1Img, status: 'active' },
  { id: '6', name: 'Saquito Completo Deluxe', price: 32000, stock: 4, category: 'Indumentaria', hasPromo: true, promoPrice: 27000, imageUrl: saquitocompleto2Img, status: 'active' },
];

const mockUsers: AdminUser[] = [
  { id: '1', name: 'Lia Admin', email: 'lia@gmail.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Juan Perez', email: 'juan@example.com', role: 'user', status: 'active' },
  { id: '3', name: 'Maria Gomez', email: 'maria@example.com', role: 'user', status: 'inactive' },
];

const mockCarouselImages: CarouselImage[] = [
  { id: '1', url: saquitocompletoImg, order: 1, isActive: true },
  { id: '2', url: saquitocompleto1Img, order: 2, isActive: true },
  { id: '3', url: saquitocompleto2Img, order: 3, isActive: false },
];

const mockAboutInfo: AboutInfo = {
  title: 'Sobre LIA',
  description: 'Somos una marca joven dedicada al diseño de prendas únicas y con estilo. Creemos en la moda consciente y en la importancia de los detalles. Nuestra misión es brindarte piezas versátiles que te acompañen en tu día a día, haciéndote sentir cómoda y empoderada.',
  imageUrl: 'https://via.placeholder.com/800x600'
};

const mockFooterInfo: FooterInfo = {
  brandName: 'LIA',
  description: 'Encontrá calidad, tendencia y comodidad en LIA. Nos dedicamos a brindarte el mejor calzado y atención, para que des cada paso con estilo.',
  whatsapp: '+54 9 11 4144-2409',
  email: 'liazapatos2001@gmail.com',
  tiktokUser: '@liazapatos',
  tiktokUrl: 'https://www.tiktok.com/@liazapatos',
  facebookUser: 'zapatos.lia.2020',
  facebookUrl: 'https://www.facebook.com/zapatos.lia.2020/',
  address: 'Avelino Díaz & Alfonsina Storni, Villa Celina, Buenos Aires',
  mapQuery: 'Avelino%20D%C3%ADaz%20%26%20Alfonsina%20Storni,%20Villa%20Celina,%20Buenos%20Aires',
  copyright: 'LIA Zapatos. Todos los derechos reservados.'
};

export const useAdminStore = create<AdminState>((set) => ({
  isAuthenticated: false,
  products: mockProducts,
  users: mockUsers,
  carouselImages: mockCarouselImages,
  featuredProductIds: ['1', '4', '6'],
  aboutInfo: mockAboutInfo,
  footerInfo: mockFooterInfo,
  login: (email, pass) => {
    if (email === 'lia@gmail.com' && pass === 'lia') {
      set({ isAuthenticated: true });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false }),
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
