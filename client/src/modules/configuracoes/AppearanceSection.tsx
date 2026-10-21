import { Palette } from 'lucide-react';
import { NucleoPolaris } from '../../components/core/NucleoPolaris';
import { Switch } from '../../components/ui/Input';
import { PolarisCard } from '../../components/ui/PolarisCard';
import { useAppearanceStore } from '../../stores/uiStore';

export function AppearanceSection() {
  const { glow, animations, reduceMotion, setAppearance } = useAppearanceStore();

  return (
    <PolarisCard icon={Palette} label="Configurações · Aparência" title="Brilho e movimento">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_200px]">
        <div className="space-y-5">
          <div>
            <label htmlFor="glow" className="label-mono flex justify-between text-text-dim">
              Intensidade do brilho <span className="text-primary">{Math.round(glow * 100)}%</span>
            </label>
            <input
              id="glow"
              type="range"
              min={0.4}
              max={1.6}
              step={0.1}
              value={glow}
              onChange={(e) => setAppearance({ glow: Number(e.target.value) })}
              className="mt-3 w-full accent-[#38BDF8]"
            />
          </div>
          <SettingRow
            title="Animações"
            description="Núcleo girando, estrelas piscando e cards entrando em sequência."
            checked={animations}
            onChange={(value) => setAppearance({ animations: value })}
          />
          <SettingRow
            title="Reduzir movimento"
            description="Deixa tudo mais calmo e estático (bom para quem sente enjoo com animações)."
            checked={reduceMotion}
            onChange={(value) => setAppearance({ reduceMotion: value })}
          />
          <p className="text-xs text-text-dim">Essas preferências ficam salvas neste aparelho.</p>
        </div>
        <NucleoPolaris className="mx-auto w-[180px]" />
      </div>
    </PolarisCard>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-text-dim">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}
