import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusLabel = { TODO: 'To Do', IN_PROGRESS: 'In Progress', DONE: 'Done' };
const statusClass = { TODO: 'badge-todo', IN_PROGRESS: 'badge-inprogress', DONE: 'badge-done' };
const priorityClass = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tasks/dashboard')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const { totalTasks, myTasks, overdueTasks, projectCount, byStatus, recentTasks } = data || {};

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">👋 Welcome, {user?.name?.split(' ')[0]}</h1>
          <p className="page-subtitle">Here's what's happening across your projects today</p>
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card purple">
          <div className="stat-icon">📁</div>
          <div className="stat-label">My Projects</div>
          <div className="stat-value">{projectCount ?? 0}</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{totalTasks ?? 0}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-icon">✅</div>
          <div className="stat-label">Completed</div>
          <div className="stat-value">{byStatus?.DONE ?? 0}</div>
        </div>
        <div className="stat-card orange">
          <div className="stat-icon">⏳</div>
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{byStatus?.IN_PROGRESS ?? 0}</div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">🚨</div>
          <div className="stat-label">Overdue</div>
          <div className="stat-value">{overdueTasks ?? 0}</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* Recent Tasks */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1.2rem' }}>🕒 Recent Activity</h2>
          {recentTasks?.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <div className="empty-title">No tasks yet</div>
              <div className="empty-desc">Create a project and add tasks to get started</div>
            </div>
          ) : (
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {recentTasks?.map(task => (
                  <tr key={task.id} style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${task.project.id}`)}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{task.title}</div>
                      {task.dueDate && (
                        <div className={`due-date ${isOverdue(task) ? 'due-overdue' : ''}`}>
                          {isOverdue(task) ? '🔴 ' : '📅 '}
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td><span style={{ color: 'var(--accent-2)', fontSize: '0.82rem' }}>{task.project.name}</span></td>
                    <td><span className={`badge ${statusClass[task.status]}`}>{statusLabel[task.status]}</span></td>
                    <td><span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="card">
          <h2 className="section-title" style={{ marginBottom: '1.2rem' }}>📊 Task Breakdown</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { label: 'To Do', key: 'TODO', color: 'var(--text-secondary)' },
              { label: 'In Progress', key: 'IN_PROGRESS', color: 'var(--accent-3)' },
              { label: 'Done', key: 'DONE', color: 'var(--success)' },
            ].map(({ label, key, color }) => {
              const count = byStatus?.[key] ?? 0;
              const pct = totalTasks ? Math.round((count / totalTasks) * 100) : 0;
              return (
                <div key={key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.85rem', color }}>{label}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{count} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span></span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(108,99,255,0.08)', borderRadius: '10px', border: '1px solid rgba(108,99,255,0.2)' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>Assigned to me</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-2)' }}>{myTasks ?? 0}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>tasks in my queue</div>
          </div>
        </div>
      </div>
    </div>
  );
}
