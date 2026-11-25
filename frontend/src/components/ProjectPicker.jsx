import Avatar from './Avatar.jsx'
import ProgressBar from './ProgressTracker/ProgressBar.jsx'
import { IconGrid, IconList } from './Icons.jsx'
import './ProjectPicker.css'

export default function ProjectPicker({
  projects,
  projectView,
  onProjectViewChange,
  onSelectProject,
  emptyMessage,
  extraControl
}) {
  return (
    <section className="manager-projects-section" aria-label="Projects">
      <div className="manager-project-controls">
        <span className="manager-project-count">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </span>
        <div className="manager-project-control-actions">
          {extraControl}
          <div className="manager-project-view-toggle" role="group" aria-label="Project display mode">
            <button
              type="button"
              className={projectView === 'list' ? 'active' : ''}
              aria-pressed={projectView === 'list'}
              aria-label="List view"
              title="List view"
              onClick={() => onProjectViewChange('list')}
            >
              <IconList size={16} />
            </button>
            <button
              type="button"
              className={projectView === 'cards' ? 'active' : ''}
              aria-pressed={projectView === 'cards'}
              aria-label="Cards view"
              title="Cards view"
              onClick={() => onProjectViewChange('cards')}
            >
              <IconGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {projects.length ? (
        <div className={`manager-project-grid ${projectView === 'list' ? 'is-list' : 'is-cards'}`}>
          {projects.map((project) => (
            <button
              type="button"
              className="manager-project-card"
              key={project.name}
              onClick={() => onSelectProject(project.name)}
              aria-label={`Open ${project.name}, ${project.tasks.length} tasks`}
            >
              <div className="manager-project-card-top">
                <div className="manager-project-summary">
                  <div className="manager-project-icon" aria-hidden="true">
                    <span>{project.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="manager-project-name">
                    <h4>{project.name}</h4>
                    <p className="manager-project-task-total">
                      {project.tasks.length} {project.tasks.length === 1 ? 'task' : 'tasks'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="manager-project-statuses" aria-label="Task status counts">
                <span><i className="project-status-dot todo" />{project.todo} to do</span>
                <span><i className="project-status-dot in-progress" />{project.inProgress} in progress</span>
                <span><i className="project-status-dot completed" />{project.completed} completed</span>
              </div>

              <div className="manager-project-progress">
                <div className="row between">
                  <span>Completion</span>
                  <strong>{project.progress}%</strong>
                </div>
                <ProgressBar value={project.progress} />
              </div>

              <div className="manager-project-members">
                <div className="manager-project-avatars">
                  {project.members.slice(0, 4).map((member) => (
                    <Avatar
                      key={member.id}
                      name={member.name}
                      color={member.color}
                      size={30}
                    />
                  ))}
                </div>
                <span>
                  {project.members.length
                    ? `${project.members.length} ${project.members.length === 1 ? 'team member' : 'team members'}`
                    : 'No team members yet'}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="manager-projects-empty">{emptyMessage}</div>
      )}
    </section>
  )
}
