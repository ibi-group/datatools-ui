export const FILTERS = ['ALL', 'PUBLISHED', 'DRAFT']

export function filterSignsByCategory (signs, filter) {
  switch (filter) {
    case 'ALL':
      return signs
    case 'PUBLISHED':
      return signs.filter(sign => sign.published)
    case 'DRAFT':
      return signs.filter(sign => !sign.published)
    default:
      return signs
  }
}
