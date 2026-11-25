import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useTasks } from '../../context/TaskContext.jsx'
import { visibleTasks, filterTasks, projectSummaries } from '../../services/taskService.js'
import KanbanBoard from '../../components/Kanban/KanbanBoard.jsx'
import TaskModal from '../../components/TaskModal/TaskModal.jsx'
import TaskToolbar, { ActiveFilterSummary } from '../../components/TaskToolbar.jsx'
import NewTaskButton from '../../components/NewTaskButton.jsx'
import ProjectPicker from '../../components/ProjectPicker.jsx'
import { useTaskModal } from '../../hooks/useTaskModal.js'
import { IconChevronLeft } from '../../components/Icons.jsx'

export default function StaffTasks() {
  const { user } = useAuth()
  const { tasks, users } = useTasks()
  const { openTaskId, openTask, closeTask } = useTaskModal()
  const [params, setParams] = useSearchParams()
  const [projectView, setProjectView] = useState('cards')
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    sortBy: 'dueDate',
    special: params.get('filter') || 'all'
  })

  const myTasks = useMemo(() => visibleTasks(tasks, user, users), [tasks, user, users])
  const projectNames = useMemo(
    () => [...new Set(myTasks.map((task) => task.engagement || 'Unassigned'))]
      .sort((a, b) => a.localeCompare(b)),
    [myTasks]
  )
  const projects = useMemo(
    () => projectSummaries(tasks, projectNames, users),
    [tasks, projectNames, users]
  )
  const selectedProject = params.get('project')
  const activeProject = projectNames.includes(selectedProject) ? selectedProject : null

  const boardTasks = useMemo(() => {
    if (!activeProject) return []
    let projectTasks = tasks.filter(
      (task) => (task.engagement || 'Unassigned') === activeProject
    )
    if (myTasksOnly) {
      projectTasks = projectTasks.filter((task) => task.assigneeId === user.id)
    }
    return filterTasks(projectTasks, { ...filters, status: 'all' })
  }, [tasks, activeProject, filters, myTasksOnly, user.id])

  const newCount = useMemo(
    () => myTasks.filter((task) => task.aiDetected && task.needsReview).length,
    [myTasks]
  )

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
    setFilters((current) => ({
      ...current,
      search: '',
      status: 'all',
      priority: 'all',
      special: 'all'
    }))
    setMyTasksOnly(false)
  }

  const newFilterBtn = (
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
  const taskFilters = (
    <>
      {newFilterBtn}
      <button
        type="button"
        className={`new-filter-btn ${myTasksOnly ? 'active' : ''}`}
        aria-pressed={myTasksOnly}
        onClick={() => setMyTasksOnly((current) => !current)}
        title="Show only tasks assigned to you"
      >
        My tasks
      </button>
    </>
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

          <div className="tasks-page-actions">
            <NewTaskButton
              assigneeId={user.id}
              projectName={activeProject}
              onCreated={(id) => {
                setFilters((current) => ({ ...current, special: 'all' }))
                openTask(id)
              }}
            />
          </div>

          <TaskToolbar value={filters} extra={taskFilters} onChange={setFilters} hideStatus />

          <ActiveFilterSummary
            filters={filters}
            myTasksOnly={myTasksOnly}
            onClear={clearTaskFilters}
          />

          <KanbanBoard tasks={boardTasks} onOpen={openTask} />
        </>
      ) : (
        <ProjectPicker
          projects={projects}
          projectView={projectView}
          onProjectViewChange={setProjectView}
          onSelectProject={selectProject}
          emptyMessage="You are not assigned to any projects yet."
        />
      )}

      {openTaskId && <TaskModal taskId={openTaskId} onClose={closeTask} />}
    </div>
  )
}
