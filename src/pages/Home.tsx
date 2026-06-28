import { useNavigate } from 'react-router-dom';
import { subjects } from '../core/subjects';
import { toolsBySubject } from '../tools/registry';
import { Logo, Icon, Shell, ContactBanner } from '../app/ui';

export function Home() {
  const navigate = useNavigate();
  return (
    <Shell>
      <div className="hc-topbar">
        <div className="hc-brand">
          <Logo size={36} />
          <div>
            <div className="hc-brand-name">Hyper<span className="hc-brand-accent">Class</span></div>
            <div className="hc-brand-sub">课堂工具箱</div>
          </div>
        </div>
        <button className="hc-iconbtn" onClick={() => navigate('/settings')} aria-label="设置">
          <Icon name="settings" />
        </button>
      </div>

      <div className="subject-grid">
        {subjects.map((s) => {
          const count = toolsBySubject(s.id).length;
          return (
            <button
              key={s.id}
              className="subject-card"
              disabled={count === 0}
              onClick={() => count && navigate(`/subject/${s.id}`)}
              style={{ ['--accent' as string]: s.accent } as React.CSSProperties}
            >
              <div className="subject-ic"><Icon name={s.icon} size={24} /></div>
              <div className="subject-name">{s.name}</div>
              <div className="subject-count">{count ? `${count} 个工具` : '敬请期待'}</div>
            </button>
          );
        })}
      </div>

      <ContactBanner />
    </Shell>
  );
}
