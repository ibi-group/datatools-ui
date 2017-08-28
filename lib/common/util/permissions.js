// @flow

import type {Entity, Feed, GtfsRoute, Project, User} from '../../types'

export function getFeedsForPermission (
  project: Project,
  user: User,
  permission: string
) {
  return project && project.feedSources
    ? project.feedSources.filter(
        (feed: Feed) =>
          user.permissions.hasFeedPermission(
            project.organizationId,
            project.id,
            feed.id,
            permission
          ) !== null
      )
    : []
}

// ensure list of feeds contains all agency IDs for set of entities
export function checkEntitiesForFeeds (
  entities: ?Array<Entity>,
  feeds: Array<Feed>
) {
  // if (!entities) return true
  // console.log(entities)
  // console.log(feeds)
  const publishableIds: Array<string> = feeds.map(f => f.id)
  const entityIds: Array<string> = entities
    ? entities.map(
        (entity: Entity) => {
          const castedEntity: GtfsRoute = ((entity: any): GtfsRoute)
          if (castedEntity.agency) {
            return castedEntity.agency.id
          } else {
            return ''
          }
        }
      )
    : []
  for (var i = 0; i < entityIds.length; i++) {
    if (publishableIds.indexOf(entityIds[i]) === -1) return false
  }
  return true
}
