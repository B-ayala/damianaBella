// ─── Temas estacionales ───────────────────────────────────────────────────────
// Define la paleta de cada estación y la metadata usada por el panel admin.
// Los valores se aplican como CSS custom properties — el override real vive
// en `seasons.css` y se activa por el atributo `data-season` en <html>.
//
// Para agregar una estación nueva: añadir entrada en SEASONS + bloque en
// seasons.css con el mismo id. El resto del flujo (preview, apply, persistencia)
// es data-driven.

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';
export type ThemeMode = 'auto' | 'manual';

export interface SeasonPalette {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryBg: string;
  accent: string;
  surface: string;
  textDark: string;
}

export interface SeasonTheme {
  id: SeasonId;
  label: string;
  description: string;
  emoji: string;
  palette: SeasonPalette;
  // Meses (1-12) en hemisferio sur (Argentina) — usados por el modo automático.
  months: number[];
}

export const SEASONS: Record<SeasonId, SeasonTheme> = {
  spring: {
    id: 'spring',
    label: 'Primavera',
    description: 'Tonos verdes frescos con acentos florales.',
    emoji: '🌸',
    palette: {
      primary: '#7BB661',
      primaryLight: '#B8E0A6',
      primaryDark: '#4F8C3A',
      primaryBg: '#F2FBEC',
      accent: '#E58FB8',
      surface: '#FFFFFF',
      textDark: '#1F3A2A',
    },
    months: [9, 10, 11],
  },
  summer: {
    id: 'summer',
    label: 'Verano',
    description: 'Cálido y luminoso, amarillos y naranjas.',
    emoji: '☀️',
    palette: {
      primary: '#F4A100',
      primaryLight: '#FFD371',
      primaryDark: '#C97A00',
      primaryBg: '#FFF8E8',
      accent: '#E2522C',
      surface: '#FFFFFF',
      textDark: '#3A2A10',
    },
    months: [12, 1, 2],
  },
  autumn: {
    id: 'autumn',
    label: 'Otoño',
    description: 'Marrones cálidos y naranjas profundos.',
    emoji: '🍂',
    palette: {
      primary: '#B8612C',
      primaryLight: '#E29A6A',
      primaryDark: '#7E3F18',
      primaryBg: '#FBF1E6',
      accent: '#8B3A1F',
      surface: '#FFFFFF',
      textDark: '#3A2418',
    },
    months: [3, 4, 5],
  },
  winter: {
    id: 'winter',
    label: 'Invierno',
    description: 'Azules fríos y blancos, sensación nevada.',
    emoji: '❄️',
    palette: {
      primary: '#4F86C6',
      primaryLight: '#A8C8E8',
      primaryDark: '#2E5A94',
      primaryBg: '#EEF5FB',
      accent: '#1F3F66',
      surface: '#FFFFFF',
      textDark: '#1A2A40',
    },
    months: [6, 7, 8],
  },
};

export const SEASON_LIST: SeasonTheme[] = [
  SEASONS.spring,
  SEASONS.summer,
  SEASONS.autumn,
  SEASONS.winter,
];

// Default usado cuando no hay preferencia guardada y el modo es manual.
// La marca LIA es lila/malva — primavera es la paleta más cercana, así que
// la usamos como fallback estético.
export const DEFAULT_SEASON: SeasonId = 'spring';

export const detectSeasonFromDate = (date: Date = new Date()): SeasonId => {
  const month = date.getMonth() + 1;
  const found = SEASON_LIST.find((s) => s.months.includes(month));
  return found?.id ?? DEFAULT_SEASON;
};

export const isSeasonId = (value: unknown): value is SeasonId =>
  typeof value === 'string' && value in SEASONS;
