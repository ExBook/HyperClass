import { useNavigate, useParams } from 'react-router-dom';
import { getSubject } from '../core/subjects';
import { toolsBySubject } from '../tools/registry';
import { Shell, StageBar, Icon, ContactBanner } from '../app/ui';

export function SubjectPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const subject = subjectId ? getSubject(subjectId) : undefined;
  const tools = subjectId ? toolsBySubject(subjectId) : [];

  if (!subject) {
    return <Shell><StageBar title="未找到学科" onBack={() => navigate('/')} /></Shell>;
  }

  return (
    <Shell>
      <StageBar crumb="工具箱" title={subject.name} onBack={() => navigate('/')} />
      {tools.length === 0 ? (
        <div className="hc-empty">这个学科的工具还在路上</div>
      ) : (
        <div className="tool-grid">
          {tools.map((t) => (
            <button
              key={t.id}
              className="tool-card"
              onClick={() => navigate(`/tool/${t.id}`)}
              style={{ ['--accent' as string]: t.accent } as React.CSSProperties}
            >
              <div className="tool-ic"><Icon name={t.icon} size={22} /></div>
              <div className="tool-title">{t.title}</div>
              <div className="tool-desc">{t.description}</div>
            </button>
          ))}
        </div>
      )}

      <ContactBanner subject={subject.name} />
    </Shell>
  );
}
