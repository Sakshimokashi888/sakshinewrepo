import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Projects() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get('/projects')
      .then(r => setProjects(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      await api.post('/projects', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create project');
    } finally { setSaving(false); }
  };

  const getDoneCount = (project) => project.tasks?.filter(t => t.status === 'DONE').length || 0;
  const getTotal = (project) => project._count?.tasks || 0;
  const getPct = (project) => {
    const total = getTotal(project);
    return total ? Math.round((getDoneCount(project) / total) * 100) : 0;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📁 Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} in your workspace</p>
        </div>
        <button id="create-project-btn" className="btn btn-primary" onClick={() => setShowModal(true)}>
          + New Project
        </button>
      </div>

      {loading ? <div className="spinner" /> : projects.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '4rem' }}>
          <div className="empty-icon">📂</div>
          <div className="empty-title">No projects yet</div>
          <div className="empty-desc">Create your first project to start collaborating</div>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>
            + Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map(project => {
            const pct = getPct(project);
            const memberCount = project.members?.length || 0;
            const myRole = project.members?.find(m => m.userId === user?.id)?.role;
            return (
              <div key={project.id} className="project-card" onClick={() => navigate(`/projects/${project.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <div className="project-name">{project.name}</div>
                  <span className={`badge ${myRole === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{myRole}</span>
                </div>
                <div className="project-desc">{project.description || 'No description provided'}</div>
                <div className="project-meta">
                  <div className="project-members">
                    {project.members?.slice(0, 4).map(m => (
                      <div key={m.userId} className="member-avatar" title={m.user?.name}>
                        {m.user?.name?.[0]?.toUpperCase()}
                      </div>
                    ))}
                    {memberCount > 4 && (
                      <div className="member-avatar" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', fontSize: '0.6rem' }}>
                        +{memberCount - 4}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {getTotal(project)} tasks
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                  <span>Progress</span><span style={{ color: pct === 100 ? 'var(--success)' : 'var(--text-secondary)', fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Created {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">New Project</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            {error && <div className="alert alert-error">{error}</div>}
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input id="project-name-input" className="form-input" type="text" placeholder="My Awesome Project"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea id="project-desc-input" className="form-textarea" placeholder="What is this project about?"
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button id="create-project-submit" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
