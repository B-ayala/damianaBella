import { useSeasonTheme } from '../../../utils/SeasonThemeProvider';
import type { SeasonId } from '../../../utils/seasonThemes';
import './SeasonalBackdrop.css';

// Glyphs por estación — emojis para no depender de assets externos.
// Se renderizan con pointer-events: none y aria-hidden para que no afecten
// ni la accesibilidad ni los clicks del usuario.
const PARTICLES: Record<SeasonId, string[]> = {
  autumn: ['🍂', '🍁', '🍂', '🍁', '🍃'],
  winter: ['❄', '❅', '❆', '❄', '✦'],
  spring: ['🌸', '🌷', '🌼', '🌸', '🍃'],
  summer: ['✦', '☀', '✧', '✦', '·'],
};

const PARTICLE_COUNT = 12;

const SeasonalBackdrop = () => {
  const { season } = useSeasonTheme();
  const glyphs = PARTICLES[season];

  return (
    <div className="seasonal-backdrop" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => (
        <span key={i} className="seasonal-particle">
          {glyphs[i % glyphs.length]}
        </span>
      ))}
    </div>
  );
};

export default SeasonalBackdrop;
