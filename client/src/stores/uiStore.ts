import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type NucleusState = 'ocioso' | 'processando' | 'ouvindo' | 'falando';

interface UiState {
  paletteOpen: boolean;
  setPaletteOpen: (open: boolean) => void;
  moreOpen: boolean;
  setMoreOpen: (open: boolean) => void;
  /** Estado do Núcleo Polaris (fica "processando" enquanto a IA pensa). */
  nucleusState: NucleusState;
  setNucleusState: (state: NucleusState) => void;
}

export const useUiStore = create<UiState>((set) => ({
  paletteOpen: false,
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  moreOpen: false,
  setMoreOpen: (moreOpen) => set({ moreOpen }),
  nucleusState: 'ocioso',
  setNucleusState: (nucleusState) => set({ nucleusState }),
}));

interface AppearanceState {
  /** Intensidade do brilho, de 0.4 a 1.6 (1 = padrão). */
  glow: number;
  /** Animações ligadas. */
  animations: boolean;
  /** Reduzir movimento (menos efeitos, mesmo com animações ligadas). */
  reduceMotion: boolean;
  setAppearance: (patch: Partial<Pick<AppearanceState, 'glow' | 'animations' | 'reduceMotion'>>) => void;
}

// Preferências de aparência ficam neste navegador (cada aparelho pode ter a sua).
export const useAppearanceStore = create<AppearanceState>()(
  persist(
    (set) => ({
      glow: 1,
      animations: true,
      reduceMotion: false,
      setAppearance: (patch) => set(patch),
    }),
    { name: 'polaris-appearance', storage: createJSONStorage(() => localStorage) },
  ),
);

/** true quando o usuário (ou o sistema) pediu menos movimento. */
export function useReducedMotion(): boolean {
  const { animations, reduceMotion } = useAppearanceStore();
  const systemPrefers =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !animations || reduceMotion || systemPrefers;
}
