import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import {
  type Icon as TablerIcon,
  IconSettings, IconArrowLeft, IconRefresh, IconHandFinger, IconMicrophone, IconRotate2,
  IconVolume, IconVolumeOff, IconPlayerPlay, IconPlayerPause, IconBellRinging, IconUserCheck,
  IconClock, IconTools, IconBook, IconMathFunction, IconAbc, IconAtom, IconFlask, IconLeaf,
  IconWorld, IconScale, IconMusic, IconPalette, IconRun, IconDeviceDesktop, IconMap2,
  IconCircleCheck, IconUsersGroup, IconTrophy, IconCrown, IconArrowBackUp, IconCards,
  IconGridDots, IconCloudRain, IconQuestionMark, IconDice, IconChartPie, IconMoodSmile,
  IconMail, IconSend, IconBulb, IconCopy,
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
  mail: IconMail, send: IconSend, bulb: IconBulb, copy: IconCopy,
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

export const HC_EMAIL = 'hyperclass@163.com';

/** “没有想要的工具?”——引导用户把需求发给开发者。variant 控制样式与文案语境。 */
export function ContactBanner(
  { subject, variant = 'banner' }: { subject?: string; variant?: 'banner' | 'card' },
) {
  const [copied, setCopied] = useState(false);
  const subjectLine = subject ? `HyperClass ${subject}工具建议` : 'HyperClass 工具建议';
  const href = `mailto:${HC_EMAIL}?subject=${encodeURIComponent(subjectLine)}`
    + `&body=${encodeURIComponent('我想要的工具:\n\n使用场景 / 年级学科:\n\n')}`;
  const title = subject ? `没有想要的${subject}工具?` : '没有你想要的工具?';
  function copy() {
    navigator.clipboard?.writeText(HC_EMAIL)
      .then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1600); })
      .catch(() => {});
  }
  return (
    <div className={`contact contact--${variant}`}>
      <div className="contact-ic"><Icon name="bulb" size={22} /></div>
      <div className="contact-text">
        <div className="contact-title">{title}</div>
        <div className="contact-sub">把需求告诉开发者,我们来做 · {HC_EMAIL}</div>
      </div>
      <div className="contact-actions">
        <button className={`contact-copy${copied ? ' done' : ''}`} onClick={copy} aria-label="复制邮箱">
          <Icon name={copied ? 'circle-check' : 'copy'} size={15} /> {copied ? '已复制' : '复制邮箱'}
        </button>
        <a className="contact-btn" href={href}><Icon name="send" size={16} /> 联系开发者</a>
      </div>
    </div>
  );
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
