import { createSelector } from 'reselect'

const getActiveProjectId = (state) => state.projects.active
const getProjects = (state) => state.projects.all

export const getActiveProject = createSelector(
  [ getActiveProjectId, getProjects ],
  (activeProjectId, projects) => {
    return projects && projects.find(p => p.id === activeProjectId)
  }
)
