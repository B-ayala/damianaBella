import type { Product } from '../types/product';

export const sampleProducts: Product[] = [
  {
    id: 1,
    name: 'Saquito Tejido Artesanal',
    price: 89.99,
    image: '/src/assets/products/saquito.png',
    images: [
      '/src/assets/products/saquito.png',
      '/src/assets/products/saquito2.png',
      '/src/assets/products/saquitocompleto.png'
    ],
    description: 'Saquito tejido a mano con diseño exclusivo, confeccionado con lana de primera calidad. Cada pieza es única y refleja el trabajo artesanal de nuestras tejedoras. Perfecto para las temporadas más frías, combinando estilo y comodidad.',
    category: 'Indumentaria',
    discount: 15,
    stock: 8,
    condition: 'new',
    freeShipping: true,
    rating: 4.5,
    reviewCount: 23,
    variants: [
      { name: 'Talla', options: ['S', 'M', 'L', 'XL'] },
      { name: 'Color', options: ['Beige', 'Gris', 'Negro'] }
    ],
    specifications: [
      { label: 'Material', value: 'Lana 100%' },
      { label: 'Cuidado', value: 'Lavar a mano' },
      { label: 'Origen', value: 'Argentina' },
      { label: 'Peso', value: '400g' }
    ],
    features: [
      'Tejido a mano por artesanas locales',
      'Lana de primera calidad',
      'Diseño exclusivo y único',
      'Confección artesanal garantizada',
      'Suave al tacto y muy abrigado'
    ],
    faqs: [
      { question: '¿Cómo debo lavar este saquito?', answer: 'Se recomienda lavar a mano con agua fría y secar en horizontal para mantener la forma.' },
      { question: '¿Encoge con el lavado?', answer: 'No, si se lava correctamente según las instrucciones mantiene su tamaño original.' },
      { question: '¿Es apto para pieles sensibles?', answer: 'Sí, utilizamos lana hipoalergénica de alta calidad.' }
    ],
    reviews: [
      { id: 1, author: 'María González', rating: 5, comment: 'Hermoso saquito, muy bien tejido y súper abrigado. Lo recomiendo 100%', date: '15 Ene 2026' },
      { id: 2, author: 'Carlos Fernández', rating: 4, comment: 'Buena calidad, el envío fue rápido. Muy conforme con la compra.', date: '10 Ene 2026' }
    ],
    warranty: 'Garantía de 30 días por defectos de fabricación',
    returnPolicy: 'Tenés 30 días desde que lo recibís para devolverlo'
  },
  {
    id: 2,
    name: 'Saquito Completo Premium',
    price: 129.99,
    image: '/src/assets/products/saquitocompleto.png',
    images: [
      '/src/assets/products/saquitocompleto.png',
      '/src/assets/products/saquitocompleto1.png',
      '/src/assets/products/saquitocompleto2.png'
    ],
    description: 'Conjunto completo de saquito tejido artesanal con bufanda incluida. Diseño premium para quienes buscan calidad y estilo. Elaborado con técnicas tradicionales de tejido.',
    category: 'Indumentaria',
    discount: 20,
    stock: 5,
    condition: 'new',
    freeShipping: true,
    rating: 4.8,
    reviewCount: 45,
    variants: [
      { name: 'Talla', options: ['M', 'L', 'XL'] },
      { name: 'Color', options: ['Azul', 'Vino', 'Negro'] }
    ],
    specifications: [
      { label: 'Material', value: 'Lana Merino' },
      { label: 'Incluye', value: 'Saquito + Bufanda' },
      { label: 'Cuidado', value: 'Lavado a mano o dry clean' },
      { label: 'Origen', value: 'Argentina' }
    ],
    features: [
      'Set completo: saquito más bufanda a juego',
      'Lana merino de alta gama',
      'Tejido con técnicas tradicionales',
      'Ideal para regalo',
      'Presentación en caja premium'
    ],
    faqs: [
      { question: '¿La bufanda viene incluida?', answer: 'Sí, el conjunto incluye tanto el saquito como la bufanda.' },
      { question: '¿Qué talla debo elegir?', answer: 'Consulta nuestra guía de talles en las imágenes del producto.' }
    ],
    reviews: [
      { id: 1, author: 'Laura Martínez', rating: 5, comment: 'Espectacular! La calidad es increíble y el conjunto es hermoso.', date: '20 Ene 2026' }
    ],
    warranty: 'Garantía de 60 días',
    returnPolicy: 'Devolución gratis dentro de los 30 días'
  },
  {
    id: 3,
    name: 'Saquito Elegante',
    price: 99.99,
    image: '/src/assets/products/saquito2.png',
    images: [
      '/src/assets/products/saquito2.png',
      '/src/assets/products/saquito.png'
    ],
    description: 'Saquito tejido con terminaciones delicadas y detalles elegantes. Perfecto para ocasiones especiales o uso diario.',
    category: 'Indumentaria',
    stock: 12,
    condition: 'new',
    freeShipping: false,
    rating: 4.3,
    reviewCount: 18,
    variants: [
      { name: 'Talla', options: ['S', 'M', 'L'] }
    ],
    specifications: [
      { label: 'Material', value: 'Lana y Algodón' },
      { label: 'Cuidado', value: 'Lavar a mano' },
      { label: 'Origen', value: 'Argentina' }
    ],
    features: [
      'Diseño elegante y versátil',
      'Terminaciones de calidad',
      'Combinación de lana y algodón',
      'Ideal para cualquier ocasión'
    ],
    warranty: 'Garantía de 30 días',
    returnPolicy: '15 días para cambios'
  },
  {
    id: 4,
    name: 'Conjunto Completo Clásico',
    price: 139.99,
    image: '/src/assets/products/saquitocompleto1.png',
    images: [
      '/src/assets/products/saquitocompleto1.png',
      '/src/assets/products/saquitocompleto2.png'
    ],
    description: 'Set completo de prendas tejidas artesanalmente con diseño clásico atemporal.',
    category: 'Indumentaria',
    discount: 10,
    stock: 7,
    condition: 'new',
    freeShipping: true,
    rating: 4.6,
    reviewCount: 31,
    specifications: [
      { label: 'Material', value: 'Lana 100%' },
      { label: 'Incluye', value: 'Saquito completo' },
      { label: 'Cuidado', value: 'Lavar a mano' }
    ],
    features: [
      'Diseño clásico y atemporal',
      'Confección artesanal',
      'Calidad garantizada'
    ],
    warranty: 'Garantía de 30 días',
    returnPolicy: 'Cambios sin cargo por 30 días'
  },
  {
    id: 5,
    name: 'Saquito Completo Deluxe',
    price: 149.99,
    image: '/src/assets/products/saquitocompleto2.png',
    images: [
      '/src/assets/products/saquitocompleto2.png',
      '/src/assets/products/saquitocompleto1.png'
    ],
    description: 'Conjunto premium de saquito tejido a mano con los mejores materiales y acabados de lujo.',
    category: 'Indumentaria',
    discount: 25,
    stock: 4,
    condition: 'new',
    freeShipping: true,
    rating: 4.9,
    reviewCount: 52,
    variants: [
      { name: 'Talla', options: ['M', 'L', 'XL'] },
      { name: 'Color', options: ['Camel', 'Gris Oscuro', 'Azul Marino'] }
    ],
    specifications: [
      { label: 'Material', value: 'Lana Merino Premium' },
      { label: 'Acabado', value: 'Deluxe' },
      { label: 'Origen', value: 'Argentina' },
      { label: 'Presentación', value: 'Caja de regalo' }
    ],
    features: [
      'Máxima calidad en materiales',
      'Tejido premium',
      'Acabados de lujo',
      'Edición limitada',
      'Incluye caja de regalo'
    ],
    faqs: [
      { question: '¿Qué hace especial a este modelo?', answer: 'Utilizamos lana merino de la más alta calidad y técnicas especiales de tejido que requieren más tiempo pero garantizan un acabado superior.' }
    ],
    reviews: [
      { id: 1, author: 'Patricia Ruiz', rating: 5, comment: 'La mejor compra que hice! Calidad insuperable.', date: '25 Ene 2026' },
      { id: 2, author: 'Jorge López', rating: 5, comment: 'Excelente para regalar, presentación impecable.', date: '22 Ene 2026' }
    ],
    warranty: 'Garantía extendida de 90 días',
    returnPolicy: 'Devolución gratis dentro de los 60 días'
  },
  {
    id: 6,
    name: 'Pantalón Artesanal',
    price: 79.99,
    image: '/src/assets/products/pantalon.jpeg',
    images: [
      '/src/assets/products/pantalon.jpeg'
    ],
    description: 'Pantalón tejido con diseño contemporáneo, cómodo y versátil.',
    category: 'Indumentaria',
    stock: 15,
    condition: 'new',
    freeShipping: false,
    rating: 4.2,
    reviewCount: 12,
    variants: [
      { name: 'Talla', options: ['S', 'M', 'L', 'XL'] }
    ],
    specifications: [
      { label: 'Material', value: 'Lana y Algodón' },
      { label: 'Cuidado', value: 'Lavar a mano' }
    ],
    features: [
      'Diseño moderno',
      'Cómodo para uso diario',
      'Tejido artesanal'
    ],
    warranty: 'Garantía de 30 días'
  },
  {
    id: 7,
    name: 'Modelo Exclusivo 1',
    price: 79.99,
    image: '/src/assets/modelos/modelo1.png',
    images: [
      '/src/assets/modelos/modelo1.png',
      '/src/assets/modelos/modelo2.png'
    ],
    description: 'Prenda exclusiva con diseño único de nuestra colección especial.',
    category: 'Indumentaria',
    stock: 6,
    condition: 'new',
    freeShipping: true,
    rating: 4.7,
    reviewCount: 28,
    specifications: [
      { label: 'Material', value: 'Lana Premium' },
      { label: 'Colección', value: 'Exclusiva' }
    ],
    features: [
      'Diseño exclusivo',
      'Edición limitada',
      'Alta calidad'
    ],
    warranty: 'Garantía de 30 días'
  },
  {
    id: 8,
    name: 'Modelo Exclusivo 2',
    price: 79.99,
    image: '/src/assets/modelos/modelo2.png',
    images: [
      '/src/assets/modelos/modelo2.png',
      '/src/assets/modelos/modelo1.png'
    ],
    description: 'Segunda pieza de nuestra colección exclusiva con terminaciones especiales.',
    category: 'Indumentaria',
    stock: 9,
    condition: 'new',
    freeShipping: true,
    rating: 4.4,
    reviewCount: 15,
    specifications: [
      { label: 'Material', value: 'Lana Premium' },
      { label: 'Colección', value: 'Exclusiva' }
    ],
    features: [
      'Diseño exclusivo',
      'Terminaciones especiales',
      'Confección artesanal'
    ],
    warranty: 'Garantía de 30 días'
  }
];

