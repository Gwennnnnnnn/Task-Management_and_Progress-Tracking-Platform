import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import Avatar from '../../components/Avatar.jsx'
import { IconEdit, IconPlus, IconTrash } from '../../components/Icons.jsx'
import './AdministratorDashboard.css'

const ROLE_OPTIONS = [
  { value: 'administrator', label: 'Administrator' },
  { value: 'manager', label: 'Manager' },
  { value: 'staff', label: 'Employee' }
]

const EMPTY_FORM = {
  name: '',
  email: '',
  title: '',
  password: '',
  role: 'staff',
  managerId: ''
}

function toggleId(ids, id) {
  return ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id]
}

function capitalizeNameParts(value) {
  return value.replace(/(^|[\s'’–-])(\p{L})/gu, (match, separator, letter) =>
    separator + letter.toLocaleUpperCase()
  )
}

function formatRole(role) {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label || role
}

export default function AdministratorDashboard() {
  const { user } = useAuth()
  const {
    users,
    deletedUsers,
    addUser,
    updateUser,
    archiveUser,
    restoreUser
  } = useTasks()
  const [tab, setTab] = useState('active')
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState('')
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [draft, setDraft] = useState(null)
  const [editError, setEditError] = useState('')

  const managers = useMemo(
    () => users.filter((candidate) => candidate.role === 'manager'),
    [users]
  )
  const editorManagers = managers.filter((manager) => manager.id !== editingUser?.id)
  const employees = useMemo(
    () => users.filter((candidate) => candidate.role === 'staff'),
    [users]
  )
  const managersByEmployee = useMemo(() => {
    const assignments = new Map()
    managers.forEach((manager) => {
      ;(manager.team || []).forEach((employeeId) => {
        assignments.set(employeeId, [...(assignments.get(employeeId) || []), manager.name])
      })
    })
    return assignments
  }, [managers])

  function openEditor(target) {
    setEditingUser(target)
    setDraft({
      name: target.name || '',
      email: target.email || '',
      title: target.title || '',
      role: target.role,
      managerId: managers
        .filter((manager) => (manager.team || []).includes(target.id))
        .map((manager) => manager.id)[0] || '',
      teamIds: (target.team || []).filter((id) => employees.some((employee) => employee.id === id)),
      permissions: {
        tasks: target.permissions?.tasks !== false,
        calendar: target.permissions?.calendar !== false,
        team: target.role === 'manager' && target.permissions?.team !== false
      }
    })
    setEditError('')
    setFeedback('')
  }

  function closeEditor() {
    setEditingUser(null)
    setDraft(null)
    setEditError('')
  }

  function closeCreateForm(confirmDiscard = true) {
    const hasInput = form.name.trim() || form.email.trim() || form.title.trim() ||
      form.password || form.role !== EMPTY_FORM.role || form.managerId
    if (confirmDiscard && hasInput &&
      !window.confirm('Cancel adding this user? Any entered information will be lost.')) {
      return
    }
    setIsAddingUser(false)
    setForm(EMPTY_FORM)
    setFormError('')
  }

  function handleCreate(event) {
    event.preventDefault()
    setFormError('')
    setFeedback('')
    if (form.role === 'staff' && !form.managerId &&
      !window.confirm('This employee will be added without a manager. Continue?')) {
      return
    }

    try {
      addUser({
        ...form,
        managerIds: form.role === 'staff' && form.managerId ? [form.managerId] : []
      }, user)
      closeCreateForm(false)
      setFeedback('User added successfully.')
    } catch (error) {
      setFormError(error.message)
    }
  }

  function handleSave(event) {
    event.preventDefault()
    setEditError('')
    const warning = draft.role === 'staff' && !draft.managerId
      ? '\n\nWarning: this employee has no manager assigned.'
      : ''
    if (!window.confirm(`Save changes to ${draft.name || 'this user'}?${warning}`)) return

    try {
      updateUser(editingUser.id, {
        ...draft,
        managerIds: draft.role === 'staff' && draft.managerId ? [draft.managerId] : []
      }, user)
      closeEditor()
      setFeedback('User changes saved.')
    } catch (error) {
      setEditError(error.message)
    }
  }

  function handleArchive(target) {
    if (!window.confirm(`Move ${target.name} to deleted users? Their account will no longer be able to sign in.`)) return
    try {
      archiveUser(target.id, user)
      setFeedback(`${target.name} moved to deleted users.`)
    } catch (error) {
      setFeedback(error.message)
    }
  }

  function handleRestore(target) {
    try {
      restoreUser(target.id, user)
      setFeedback(`${target.name} restored.`)
    } catch (error) {
      setFeedback(error.message)
    }
  }

  function updateForm(field, value) {
    const nextValue = field === 'name' ? capitalizeNameParts(value) : value
    setForm((current) => ({ ...current, [field]: nextValue }))
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const shownUsers = tab === 'active' ? users : deletedUsers
  const assignedPeople = (target) => {
    if (target.role === 'manager') {
      return (target.team || [])
        .map((id) => employees.find((employee) => employee.id === id)?.name)
        .filter(Boolean)
    }
    return managersByEmployee.get(target.id) || []
  }

  return (
    <div className="administrator-dashboard fade-in">
      <div className="administrator-metrics">
        <div className="panel administrator-metric">
          <span>Managers</span>
          <strong>{managers.length}</strong>
        </div>
        <div className="panel administrator-metric">
          <span>Employees</span>
          <strong>{employees.length}</strong>
        </div>
        <div className="panel administrator-metric">
          <span>Deleted users</span>
          <strong>{deletedUsers.length}</strong>
        </div>
      </div>

      <div className="administrator-management-title">
        <div>
          <h2>User management</h2>
          <p>Assignments and section access are managed together in each user’s editor.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => {
          setIsAddingUser(true)
          setFormError('')
        }}>
          <IconPlus size={16} /> Add user
        </button>
      </div>

      <section className="panel administrator-section">
        <div className="administrator-section-heading administrator-heading-row">
          <div className="administrator-tabs" role="tablist" aria-label="User status">
            <button type="button" role="tab" aria-selected={tab === 'active'} onClick={() => setTab('active')}>
              Active users <span>{users.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={tab === 'deleted'} onClick={() => setTab('deleted')}>
              Deleted users <span>{deletedUsers.length}</span>
            </button>
          </div>
        </div>
        {feedback && <p className="administrator-feedback" role="status">{feedback}</p>}
        <div className="administrator-table-wrap">
          <table className="administrator-table administrator-users-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Assignments</th>
                <th scope="col">Section access</th>
                {tab === 'deleted' && <th scope="col">Deleted</th>}
                <th scope="col" className="administrator-actions-heading">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shownUsers.map((target) => (
                <tr key={target.id}>
                  <th scope="row">
                    <span className="administrator-person">
                      <Avatar name={target.name} color={target.color} size={34} />
                      <span>
                        <strong>{target.name}</strong>
                        <small>{target.email}</small>
                      </span>
                    </span>
                  </th>
                  <td>
                    <span className="administrator-role">{formatRole(target.role)}</span>
                  </td>
                  <td className="administrator-assignment-summary">
                    {assignedPeople(target).length
                      ? assignedPeople(target).join(', ')
                      : <span className="administrator-empty">No manager or team assignments</span>}
                  </td>
                  <td>
                    <div className="administrator-access-summary">
                      {['tasks', 'calendar', ...(target.role === 'manager' ? ['team'] : [])]
                        .filter((permission) => target.permissions?.[permission] !== false)
                        .map((permission) => (
                          <span className="administrator-access-pill" key={permission}>
                            {permission === 'team'
                              ? 'Team management'
                              : permission === 'tasks' ? 'Tasks' : 'Calendar'}
                          </span>
                        ))}
                      {!target.permissions?.tasks && !target.permissions?.calendar &&
                        (target.role !== 'manager' || !target.permissions?.team) && (
                          <span className="administrator-empty">No sections enabled</span>
                        )}
                    </div>
                  </td>
                  {tab === 'deleted' && (
                    <td>{target.deletedAt ? new Date(target.deletedAt).toLocaleDateString() : '—'}</td>
                  )}
                  <td className="administrator-actions-cell">
                    {tab === 'active' ? (
                      <span className="administrator-icon-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openEditor(target)}
                          aria-label={`Edit ${target.name}`}
                          title={`Edit ${target.name}`}
                        >
                          <IconEdit size={15} />
                        </button>
                        {target.id !== user.id && (
                          <button
                            type="button"
                            className="btn btn-danger btn-icon btn-sm"
                            onClick={() => handleArchive(target)}
                            aria-label={`Delete ${target.name}`}
                            title={`Delete ${target.name}`}
                          >
                            <IconTrash size={15} />
                          </button>
                        )}
                      </span>
                    ) : (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRestore(target)}>
                        Restore
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!shownUsers.length && (
                <tr>
                  <td className="administrator-empty-row" colSpan={tab === 'deleted' ? 6 : 5}>
                    {tab === 'deleted' ? 'There are no deleted users.' : 'There are no active users.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAddingUser && (
        <div className="administrator-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCreateForm()
        }}>
          <form className="administrator-modal administrator-create-modal" role="dialog" aria-modal="true" aria-labelledby="administrator-create-title" onSubmit={handleCreate}>
            <div className="administrator-modal-heading">
              <div>
                <h2 id="administrator-create-title">Add a user</h2>
                <p>Create an account and choose its role and manager.</p>
              </div>
            </div>
            <div className="administrator-modal-content">
              <div className="administrator-edit-grid">
                <label className="field">
                  <span>Full name</span>
                  <input className="input" required value={form.name} onChange={(event) => updateForm('name', event.target.value)} />
                </label>
                <label className="field">
                  <span>Email address</span>
                  <input className="input" type="email" required value={form.email} onChange={(event) => updateForm('email', event.target.value)} />
                </label>
                <label className="field">
                  <span>Job title</span>
                  <input className="input" required value={form.title} onChange={(event) => updateForm('title', event.target.value)} />
                </label>
                <label className="field">
                  <span>Temporary password</span>
                  <input className="input" type="password" minLength={8} required value={form.password} onChange={(event) => updateForm('password', event.target.value)} autoComplete="new-password" />
                </label>
                <label className="field">
                  <span>Role</span>
                  <select className="select" value={form.role} onChange={(event) => updateForm('role', event.target.value)}>
                    {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                {form.role === 'staff' && (
                  <label className="field">
                    <span>Manager</span>
                    <select className="select" value={form.managerId} onChange={(event) => updateForm('managerId', event.target.value)}>
                      <option value="">Unassigned</option>
                      {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {formError && <p className="administrator-error" role="alert">{formError}</p>}
            </div>
            <div className="administrator-modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeCreateForm}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add user</button>
            </div>
          </form>
        </div>
      )}

      {editingUser && draft && (
        <div className="administrator-modal-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeEditor()
        }}>
          <form className="administrator-modal" role="dialog" aria-modal="true" aria-labelledby="administrator-edit-title" onSubmit={handleSave}>
            <div className="administrator-modal-heading">
              <div>
                <h2 id="administrator-edit-title">Edit user</h2>
                <p>Update role, assignments, and workspace access.</p>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={closeEditor}>Close</button>
            </div>
            <div className="administrator-modal-content">
              <div className="administrator-edit-grid">
                <label className="field">
                  <span>Full name</span>
                  <input className="input" required value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
                </label>
                <label className="field">
                  <span>Email address</span>
                  <input className="input" type="email" required value={draft.email} onChange={(event) => updateDraft('email', event.target.value)} />
                </label>
                <label className="field">
                  <span>Job title</span>
                  <input className="input" required value={draft.title} onChange={(event) => updateDraft('title', event.target.value)} />
                </label>
                <label className="field">
                  <span>Role</span>
                  <select
                    className="select"
                    value={draft.role}
                    disabled={editingUser.id === user.id}
                    onChange={(event) => updateDraft('role', event.target.value)}
                  >
                    {ROLE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {editingUser.id === user.id && <small className="administrator-field-note">You cannot change your own role.</small>}
                </label>
              </div>

              {draft.role === 'staff' && (
                <fieldset className="administrator-editor-group">
                  <legend>Manager assignments</legend>
                  <label className="administrator-manager-select">
                    <span>Manager</span>
                    <select
                      className="select"
                      value={draft.managerId}
                      onChange={(event) => updateDraft('managerId', event.target.value)}
                    >
                      <option value="">Unassigned</option>
                      {editorManagers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                    </select>
                  </label>
                  {!draft.managerId && <p className="administrator-warning">Warning: this employee has no manager assigned.</p>}
                </fieldset>
              )}
              {draft.role === 'manager' && (
                <fieldset className="administrator-editor-group">
                  <legend>Team assignments</legend>
                  {employees.length ? employees.map((employee) => (
                    <label key={employee.id}>
                      <input
                        type="checkbox"
                        checked={draft.teamIds.includes(employee.id)}
                        onChange={() => updateDraft('teamIds', toggleId(draft.teamIds, employee.id))}
                      />
                      {employee.name}
                    </label>
                  )) : <small>No employees are available.</small>}
                </fieldset>
              )}

              <fieldset className="administrator-editor-group">
                <legend>Section access</legend>
                {[
                  ['tasks', 'Tasks'],
                  ['calendar', 'Calendar'],
                  ...(draft.role === 'manager' ? [['team', 'Team management']] : [])
                ].map(([permission, label]) => (
                  <label key={permission}>
                    <input
                      type="checkbox"
                      checked={draft.permissions[permission]}
                      onChange={(event) => updateDraft('permissions', {
                        ...draft.permissions,
                        [permission]: event.target.checked
                      })}
                    />
                    {label}
                  </label>
                ))}
              </fieldset>
              {editError && <p className="administrator-error" role="alert">{editError}</p>}
            </div>
            <div className="administrator-modal-footer">
              <button type="button" className="btn btn-ghost" onClick={closeEditor}>Cancel</button>
              <button type="submit" className="btn btn-primary">Save changes</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
