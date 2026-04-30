import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const STATUS_COLS = [
  { key: 'TODO', label: 'To Do', cls: 'col-todo' },
  { key: 'IN_PROGRESS', label: 'In Progress', cls: 'col-inprogress' },
  { key: 'DONE', label: 'Done', cls: 'col-done' },
];
const priorityClass = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };

function isOverdue(task) {
  return task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
}

function TaskModal({ task, members, isAdmin, onClose, onSave, onDelete }) {
  const [form, setForm] = useState({
    title: task?.title || '', description: task?.description || '',
    status: task?.status || 'TODO', priority: task?.priority || 'MEDIUM',
    dueDate: task?.dueDate ? task.dueDate.slice(0, 10) : '',
    assigneeId: task?.assigneeId || '',
  });
  const [saving, setSaving] = useState(false);
  const isNew = !task?.id;

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSave(form, task?.id);
    setSaving(false);
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{isNew ? '+ New Task' : 'Edit Task'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" type="text" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="form-select" value={form.priority} disabled={!isAdmin}
                onChange={e => setForm({ ...form, priority: e.target.value })}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={form.dueDate} disabled={!isAdmin}
                onChange={e => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select className="form-select" value={form.assigneeId} disabled={!isAdmin}
                onChange={e => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            {!isNew && isAdmin && (
              <button type="button" className="btn btn-danger btn-sm"
                onClick={() => onDelete(task.id)}>Delete</button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function AddMemberModal({ projectId, onClose, onAdded }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ userId: '', role: 'MEMBER' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(r => setUsers(r.data)).catch(() => setError('Could not load users (Admin only)'));
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await api.post(`/projects/${projectId}/members`, form);
      onAdded();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add member');
    } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: '380px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-group">
            <label className="form-label">Select User</label>
            <select className="form-select" value={form.userId}
              onChange={e => setForm({ ...form, userId: e.target.value })} required>
              <option value="">-- Choose user --</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-select" value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.userId}>
              {saving ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [taskModal, setTaskModal] = useState(null); // null | {} | task obj
  const [memberModal, setMemberModal] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.get(`/projects/${id}`)
      .then(r => setProject(r.data))
      .catch(() => { setError('Project not found or access denied'); setLoading(false); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const myMember = project?.members?.find(m => m.userId === user?.id);
  const isAdmin = myMember?.role === 'ADMIN';

  const handleSaveTask = async (form, taskId) => {
    try {
      if (taskId) {
        await api.put(`/tasks/${taskId}`, form);
      } else {
        await api.post(`/projects/${id}/tasks`, form);
      }
      setTaskModal(null);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    await api.delete(`/tasks/${taskId}`);
    setTaskModal(null);
    load();
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member?')) return;
    await api.delete(`/projects/${id}/members/${userId}`);
    load();
  };

  const handleDeleteProject = async () => {
    if (!window.confirm(`Delete project "${project.name}"? This is irreversible.`)) return;
    await api.delete(`/projects/${id}`);
    navigate('/projects');
  };

  if (loading) return <div className="spinner" />;
  if (error) return <div className="alert alert-error" style={{ maxWidth: 400, margin: '3rem auto' }}>{error}</div>;

  const tasksByStatus = (status) => project.tasks?.filter(t => t.status === status) || [];
  const doneCount = tasksByStatus('DONE').length;
  const totalCount = project.tasks?.length || 0;
  const pct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/projects')}>← Back</button>
            <span className={`badge ${isAdmin ? 'badge-admin' : 'badge-member'}`}>{myMember?.role}</span>
          </div>
          <h1 className="page-title">{project.name}</h1>
          {project.description && <p className="page-subtitle">{project.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <>
              <button id="add-task-btn" className="btn btn-primary" onClick={() => setTaskModal({})}>+ Add Task</button>
              <button className="btn btn-secondary" onClick={() => setMemberModal(true)}>👥 Add Member</button>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>🗑 Delete</button>
            </>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            {doneCount} of {totalCount} tasks completed
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: pct === 100 ? 'var(--success)' : 'var(--accent-2)' }}>{pct}%</span>
        </div>
        <div className="progress-bar" style={{ height: '6px' }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {STATUS_COLS.map(col => {
          const tasks = tasksByStatus(col.key);
          return (
            <div key={col.key} className={`kanban-col ${col.cls}`}>
              <div className="kanban-col-header">
                <span className="kanban-col-title">{col.label}</span>
                <span className="kanban-col-count">{tasks.length}</span>
              </div>
              <div className="task-cards">
                {tasks.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    No tasks
                  </div>
                )}
                {tasks.map(task => (
                  <div key={task.id} className="task-card" onClick={() => setTaskModal(task)}>
                    <div className="task-title">{task.title}</div>
                    {task.description && <div className="task-desc">{task.description}</div>}
                    <div className="task-footer">
                      <span className={`badge ${priorityClass[task.priority]}`}>{task.priority}</span>
                      {task.assignee && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.62rem', fontWeight: 700
                          }}>{task.assignee.name[0]}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.assignee.name.split(' ')[0]}</span>
                        </div>
                      )}
                    </div>
                    {task.dueDate && (
                      <div className={`due-date ${isOverdue(task) ? 'due-overdue' : ''}`} style={{ marginTop: '0.5rem' }}>
                        {isOverdue(task) ? '🔴 Overdue · ' : '📅 '}
                        {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Members */}
      <div className="members-section">
        <h2 className="section-title">👥 Team Members</h2>
        <div className="members-list">
          {project.members?.map(m => (
            <div key={m.userId} className="member-row">
              <div className="member-row-avatar">{m.user?.name?.[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div className="member-row-name">{m.user?.name}</div>
                <div className="member-row-email">{m.user?.email}</div>
              </div>
              <span className={`badge ${m.role === 'ADMIN' ? 'badge-admin' : 'badge-member'}`}>{m.role}</span>
              {isAdmin && m.userId !== user?.id && (
                <button className="btn btn-danger btn-sm" onClick={() => handleRemoveMember(m.userId)}>Remove</button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Task Modal */}
      {taskModal !== null && (
        <TaskModal
          task={taskModal?.id ? taskModal : null}
          members={project.members || []}
          isAdmin={isAdmin}
          onClose={() => setTaskModal(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Add Member Modal */}
      {memberModal && (
        <AddMemberModal
          projectId={id}
          onClose={() => setMemberModal(false)}
          onAdded={() => { setMemberModal(false); load(); }}
        />
      )}
    </div>
  );
}
