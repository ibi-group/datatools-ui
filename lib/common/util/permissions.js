export function getFeedsForPermission (project, user, permission) {
  return project && project.feedSources
    ? project.feedSources.filter((feed) => {
      return user.permissions.hasFeedPermission(project.organizationId, project.id, feed.id, permission) !== null
    })
    : []
}

// ensure list of feeds contains all agency IDs for set of entities
export function checkEntitiesForFeeds (entities, feeds) {
  // if (!entities) return true
  // console.log(entities)
  // console.log(feeds)
  const publishableIds = feeds.map(f => f.id)
  const entityIds = entities ? entities.map(e => e.agency ? e.agency.id : null) : []
  for (var i = 0; i < entityIds.length; i++) {
    if (publishableIds.indexOf(entityIds[i]) === -1) return false
  }
  return true
}
