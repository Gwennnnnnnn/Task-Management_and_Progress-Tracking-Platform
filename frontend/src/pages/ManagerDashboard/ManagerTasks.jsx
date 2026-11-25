import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks, filterTasks, projectSummaries } from '../../services/taskService.js'
import KanbanBoard from '../../components/Kanban/KanbanBoard.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import TaskToolbar, { ActiveFilterSummary } from '../../components/TaskToolbar.jsx'
import NewTaskButton from '../../components/NewTaskButton.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'
import ProjectPicker from '../../components/ProjectPicker.jsx'
import { IconChevronLeft } from '../../components/Icons.jsx'

export default function ManagerTasks() {
  const { user } = useAuth()
  const { tasks, users, engagements } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()
  const [params, setParams] = useSearchParams()

  const me = users.find((u) => u.id === user.id)
  const teamUsers = useMemo(
    () => users.filter((u) => u.id === user.id || me?.team?.includes(u.id)),
    [users, me, user.id]
  )

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'dueDate',
    special: params.get('filter') || 'all'
  })
  // Pre-filter by employee if arriving from the Team page (?employee=).
  const [employee, setEmployee] = useState(params.get('employee') || 'all')
  const [myTasksOnly, setMyTasksOnly] = useState(false)
  const [myProjectOnly, setMyProjectOnly] = useState(false)
  const [projectView, setProjectView] = useState('cards')

  const teamTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])
  const employeeTasks = useMemo(
    () => employee === 'all' ? teamTasks : teamTasks.filter((task) => task.assigneeId === employee),
    [teamTasks, employee]
  )
  const projectNames = useMemo(() => {
    const names = new Set(engagements || [])
    employeeTasks.forEach((task) => names.add(task.engagement || 'Unassigned'))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [engagements, employeeTasks])
  const selectedProject = params.get('project')
  const activeProject = projectNames.includes(selectedProject) ? selectedProject : null

  const projects = useMemo(
    () => projectSummaries(employeeTasks, projectNames, users),
    [projectNames, employeeTasks, users]
  )
  const displayedProjects = useMemo(
    () => myProjectOnly
      ? projects.filter((project) => project.tasks.some((task) => task.assigneeId === user.id))
      : projects,
    [projects, myProjectOnly, user.id]
  )
  const newCount = useMemo(
    () => teamTasks.filter((task) => task.aiDetected && task.needsReview).length,
    [teamTasks]
  )

  const boardTasks = useMemo(() => {
    let list = filterTasks(
      activeProject
        ? teamTasks.filter((task) => (task.engagement || 'Unassigned') === activeProject)
        : teamTasks,
      { ...filters, status: 'all' }
    )
    if (myTasksOnly) {
      list = list.filter((task) => task.assigneeId === user.id)
    } else if (employee !== 'all') {
      list = list.filter((task) => task.assigneeId === employee)
    }
    return list
  }, [teamTasks, filters, employee, activeProject, myTasksOnly, user.id])

  function selectProject(projectName) {
    const nextParams = new URLSearchParams(params)
    nextParams.set('project', projectName)
    setParams(nextParams)
  }

  function showProjects() {
    const nextParams = new URLSearchParams(params)
    nextParams.delete('project')
    setParams(nextParams)
  }

  function clearTaskFilters() {
    setFilters({
      search: '',
      status: 'all',
      priority: 'all',
      sortBy: 'dueDate',
      special: 'all'
    })
    setEmployee('all')
    setMyTasksOnly(false)
  }

  const newTasksFilter = (
    <button
      type="button"
      className={`new-filter-btn ${filters.special === 'new' ? 'active' : ''}`}
      aria-pressed={filters.special === 'new'}
      onClick={() => setFilters((current) => ({
        ...current,
        special: current.special === 'new' ? 'all' : 'new'
      }))}
      title="Show newly added tasks"
    >
      New
      {newCount > 0 && <span className="nfb-count">{newCount}</span>}
    </button>
  )

  const extraFilters = (
    <>
      <select
        value={employee}
        onChange={(event) => {
          setEmployee(event.target.value)
          if (event.target.value !== 'all') setMyTasksOnly(false)
        }}
        aria-label="Filter by employee"
      >
        <option value="all">All employees</option>
        {teamUsers.map((u) => (
          <option key={u.id} value={u.id}>{u.name}{u.id === user.id ? ' (me)' : ''}</option>
        ))}
      </select>
      {newTasksFilter}
      <button
        type="button"
        className={`new-filter-btn ${myTasksOnly ? 'active' : ''}`}
        aria-pressed={myTasksOnly}
        onClick={() => {
          const next = !myTasksOnly
          setMyTasksOnly(next)
          if (next) setEmployee('all')
        }}
        title="Show only tasks assigned to you"
      >
        My tasks
      </button>
    </>
  )

  const myProjectsFilter = (
    <button
      type="button"
      className={`new-filter-btn ${myProjectOnly ? 'active' : ''}`}
      aria-pressed={myProjectOnly}
      onClick={() => {
        const next = !myProjectOnly
        setMyProjectOnly(next)
        if (next) setEmployee('all')
      }}
      title="Show projects with tasks assigned to you"
    >
      My projects
    </button>
  )

  return (
    <div className="fade-in">
      {activeProject ? (
        <>
          <nav className="manager-project-breadcrumb" aria-label="Breadcrumb">
            <button type="button" onClick={showProjects}>
              <IconChevronLeft size={16} />
              Projects
            </button>
          </nav>
          <h3 className="manager-project-title">{activeProject}</h3>
        </>
      ) : (
        <>
          <ActiveFilterSummary
            additionalLabels={myProjectOnly ? ['My projects'] : []}
            onClear={() => setMyProjectOnly(false)}
          />
          <ProjectPicker
            projects={displayedProjects}
            projectView={projectView}
            onProjectViewChange={setProjectView}
            onSelectProject={selectProject}
            extraControl={myProjectsFilter}
            emptyMessage={myProjectOnly
              ? 'You do not have tasks assigned in any projects yet.'
              : 'No projects found for this team member.'}
          />
        </>
      )}

      {activeProject && <>
      <div className="tasks-page-actions">
        {/* New tasks are created for the manager's own account so they land in
            their own To Do column (managers can only move their own cards). */}
        <NewTaskButton
          assigneeId={user.id}
          projectName={activeProject}
          onCreated={(id) => {
            // Make sure the new To Do card is visible: show the manager's own
            // tasks (and clear any special filter) before opening it.
            setEmployee(user.id)
            setFilters((f) => ({ ...f, special: 'all' }))
            openTask(id)
          }}
        />
      </div>

      <TaskToolbar value={filters} onChange={setFilters} extra={extraFilters} hideStatus />

      <ActiveFilterSummary
        filters={filters}
        myTasksOnly={myTasksOnly}
        employeeLabel={employee !== 'all'
          ? teamUsers.find((candidate) => candidate.id === employee)?.name
          : null}
        onClear={clearTaskFilters}
      />

      <KanbanBoard tasks={boardTasks} onOpen={openTask} />
      </>}

      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
