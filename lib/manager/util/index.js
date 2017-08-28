// @flow

import type {Project} from '../../types'

export function findProjectByFeedSource (
  allProjects: ?Array<Project>,
  feedSourceId: string
): ?Project {
  return allProjects
    ? allProjects.find(p => {
      if (!p.feedSources) {
        return false
      }
      return p.feedSources.findIndex(fs => fs.id === feedSourceId) !== -1
    })
    : null
}
