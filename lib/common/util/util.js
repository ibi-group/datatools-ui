// @flow

import gravatar from 'gravatar'

export function defaultSorter (a: any, b: any): number {
  if (a.isCreating && !b.isCreating) return -1
  if (!a.isCreating && b.isCreating) return 1
  if (a.name && b.name && a.name.toLowerCase() < b.name.toLowerCase()) return -1
  if (a.name && b.name && a.name.toLowerCase() > b.name.toLowerCase()) return 1
  return 0
}

export function versionsSorter (a: any, b: any): number {
  if (a.feedSource.name < b.feedSource.name) return -1
  if (a.feedSource.name > b.feedSource.name) return 1
  return 0
}

export function retrievalMethodString (method: string): string {
  switch (method) {
    case 'MANUALLY_UPLOADED':
      return 'Manually Uploaded'
    case 'FETCHED_AUTOMATICALLY':
      return 'Fetched Automatically'
    case 'PRODUCED_IN_HOUSE':
      return 'Produced In-house'
    default:
      throw new Error('Unknown method')
  }
}

export function generateUID () {
  // TODO: replace with better UID generator if possible
  // this has a 1 in 1.7 million chance of a collision
  return ('0000' + ((Math.random() * Math.pow(36, 4)) << 0).toString(36)).slice(
    -4
  )
}

export function generateRandomInt (min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function generateRandomColor (): string {
  var letters = '0123456789ABCDEF'.split('')
  var color = ''
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}
// export function invertHex (hexnum) {
//   if (hexnum.length != 6) {
//     alert('Hex color must be six hex numbers in length.')
//     return false
//   }
//
//   hexnum = hexnum.toUpperCase()
//   var splitnum = hexnum.split('')
//   var resultnum = ''
//   var simplenum = 'FEDCBA9876'.split('')
//   var complexnum = new Array()
//   complexnum.A = '5'
//   complexnum.B = '4'
//   complexnum.C = '3'
//   complexnum.D = '2'
//   complexnum.E = '1'
//   complexnum.F = '0'
//
//   for(var i=0; i<6; i++){
//     if (!isNaN(splitnum[i])) {
//       resultnum += simplenum[splitnum[i]]
//     } else if (complexnum[splitnum[i]]){
//       resultnum += complexnum[splitnum[i]]
//     } else {
//       alert('Hex colors must only include hex numbers 0-9, and A-F')
//       return false
//     }
//   }
//
//   return resultnum
// }
export function idealTextColor (bgColor: string): string {
  var nThreshold = 105
  var components = getRGBComponents(bgColor)
  var bgDelta =
    components.R * 0.299 + components.G * 0.587 + components.B * 0.114

  return 255 - bgDelta < nThreshold ? '000000' : 'FFFFFF'
}

function getRGBComponents (color: string): {R: number, G: number, B: number} {
  var r = color.substring(1, 3)
  var g = color.substring(3, 5)
  var b = color.substring(5, 7)

  return {
    R: parseInt(r, 16),
    G: parseInt(g, 16),
    B: parseInt(b, 16)
  }
}
// export const UserIsAuthenticated = UserAuthWrapper({
//   authSelector: state => state.user,
//   predicate: user => user.profile !== null,
//   // redirectAction: routerPush,
//   failureRedirectPath: '/',
//   allowRedirectBack: false,
//   wrapperDisplayName: 'UserIsAuthenticated'
// })
//
// export const UserIsAdmin = UserAuthWrapper({
//   authSelector: state => state.user,
//   predicate: user => user.permissions && user.permissions.isApplicationAdmin(),
//   // redirectAction: routerPush,
//   failureRedirectPath: '/',
//   allowRedirectBack: false,
//   wrapperDisplayName: 'UserIsAdmin'
// })

export function isValidZipFile (file: File): boolean {
  const nameArray = file.name.split('.')
  return (
    // check for various possible zip file types
    (file.type === 'application/zip' ||
      file.type === 'application/x-zip' ||
      file.type === 'application/octet-stream' ||
      file.type === 'application/x-zip-compressed') &&
    nameArray[nameArray.length - 1] === 'zip'
  )
}

export function getProfileLink (email: string): string {
  return gravatar.profile_url(email, {format: 'html'})
}
