import { writeFileSync } from 'fs'

import fetch from 'isomorphic-fetch'

const logger = (msg) => {
  console.log(`[MOBILITY DATA RULES IMPORTER]: ${msg}`)
}

const findDescription = (text, header) => {
  // Split the rules.MD file into lines
  let lines = text.split('\n')
  // Remove the distracting top part of the file
  const moreDetails = lines.findIndex(l => l.includes('More details'))
  lines = lines.splice(moreDetails)

  const description = lines.findIndex(l => l.includes(header))

  // Edge cases? Something is strange about the file
  if (header === 'equal_shape_distance_diff_coordinates') {
    return lines[description + 4]
  }
  if (header === 'same_name_and_description_for_stop' || header === 'same_name_and_description_for_route') {
    return lines[description + 2] + '\n\n' + lines[description + 4]
  }

  return lines[description + 2]
}

logger('Writing gtfs-validator rules.MD to JSON')
fetch(
  'https://raw.githubusercontent.com/MobilityData/gtfs-validator/master/RULES.md'
)
  .then((raw) => raw.text())
  .then((text) => {
    logger('rules.MD downloaded!')
    // Match all rule headings
    const rules = text
      .match(/### .*/g)
      .filter((rule) => rule.includes('_'))
      .map((rule) => rule.split('### ')[1])

    // Extract descriptions
    const rulesAndDescriptions = rules.map((rule) => ({
      rule,
      description: findDescription(text, rule)
    }))
    logger('rules.MD data extracted successfully!')
    writeFileSync('lib/manager/components/validation/rules.json', JSON.stringify(rulesAndDescriptions))
    logger('Wrote gtfs-validator rules.MD to JSON')
  })
