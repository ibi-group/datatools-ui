// @flow

export function formatHeadway (seconds: number): string {
  if (seconds > 0) {
    return '' + Math.round(seconds / 60)
  } else if (seconds === 0) {
    return '0'
  } else {
    return 'N/A'
  }
}

export function formatSpeed (metersPerSecond: number): string {
  return metersPerSecond >= 0 ? '' + Math.round(metersPerSecond * 2.236936) : 'N/D'
}
