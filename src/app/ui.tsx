import type { CSSProperties, ReactNode } from 'react';
import {
  type Icon as TablerIcon,
  IconSettings, IconArrowLeft, IconRefresh, IconHandFinger, IconMicrophone, IconRotate2,
  IconVolume, IconVolumeOff, IconPlayerPlay, IconPlayerPause, IconBellRinging, IconUserCheck,
  IconClock, IconTools, IconBook, IconMathFunction, IconAbc, IconAtom, IconFlask, IconLeaf,
  IconWorld, IconScale, IconMusic, IconPalette, IconRun, IconDeviceDesktop, IconMap2,
  IconCircleCheck, IconUsersGroup, IconTrophy, IconCrown, IconArrowBackUp, IconCards,
  IconGridDots, IconCloudRain, IconQuestionMark, IconDice, IconChartPie, IconMoodSmile,
} from '@tabler/icons-react';

const ICONS: Record<string, TablerIcon> = {
  settings: IconSettings, 'arrow-left': IconArrowLeft, refresh: IconRefresh,
  'hand-finger': IconHandFinger, microphone: IconMicrophone, 'rotate-2': IconRotate2,
  volume: IconVolume, 'volume-off': IconVolumeOff, 'player-play': IconPlayerPlay,
  'player-pause': IconPlayerPause, 'bell-ringing': IconBellRinging, 'user-check': IconUserCheck,
  clock: IconClock, tools: IconTools, book: IconBook, 'math-function': IconMathFunction,
  abc: IconAbc, atom: IconAtom, flask: IconFlask, leaf: IconLeaf, world: IconWorld,
  scale: IconScale, music: IconMusic, palette: IconPalette, run: IconRun,
  'device-desktop': IconDeviceDesktop, 'map-2': IconMap2, 'circle-check': IconCircleCheck,
  'users-group': IconUsersGroup, trophy: IconTrophy, crown: IconCrown, 'arrow-back-up': IconArrowBackUp,
  cards: IconCards, 'grid-dots': IconGridDots, 'cloud-rain': IconCloudRain,
  dice: IconDice, 'chart-pie': IconChartPie, 'mood-smile': IconMoodSmile,
};

export function Icon(
  { name, size = 20, stroke = 1.5, style }:
  { name: string; size?: number; stroke?: number; style?: CSSProperties },
) {
  const C = ICONS[name] ?? IconQuestionMark;
  return <C size={size} stroke={stroke} style={style} aria-hidden />;
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label="HyperClass">
      <rect x="13" y="12" width="11" height="40" rx="5.5" fill="var(--ink)" />
      <rect x="40" y="12" width="11" height="40" rx="5.5" fill="var(--ink)" />
      <rect x="14" y="27" width="36" height="11" rx="5.5" fill="var(--coral)" transform="rotate(-20 32 32)" />
    </svg>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  return <div className="hc-page">{children}</div>;
}

export function Btn(
  { children, onClick, variant, disabled }:
  { children: ReactNode; onClick?: () => void; variant?: 'coral'; disabled?: boolean },
) {
  return (
    <button className={`hc-btn${variant ? ' hc-btn--' + variant : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function StageBar(
  { crumb, title, onBack, actions }:
  { crumb?: string; title: string; onBack: () => void; actions?: ReactNode },
) {
  return (
    <div className="hc-stage-bar">
      <button className="hc-back" onClick={onBack} aria-label="返回"><Icon name="arrow-left" /></button>
      <div className="hc-stage-title">
        {crumb && <span className="crumb">{crumb}</span>}
        <h1>{title}</h1>
      </div>
      <div className="hc-stage-actions">{actions}</div>
    </div>
  );
}
