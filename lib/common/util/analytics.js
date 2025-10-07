// @flow

import ReactGA from 'react-ga'

// Check if Google Analytics is enabled for the application.
const hasAnalytics: boolean =
  process.env.NODE_ENV !== 'development' &&
  !!process.env.GOOGLE_ANALYTICS_TRACKING_ID
if (!hasAnalytics) console.warn('Google Analytics not enabled.')
else ReactGA.initialize(process.env.GOOGLE_ANALYTICS_TRACKING_ID)

/**
 * Log page views in Google Analytics (if enabled).
 */
export function logPageView (): void {
  if (hasAnalytics) {
    const page = `${window.location.pathname}${window.location.search}`
    ReactGA.set({page})
    ReactGA.pageview(page)
  }
}
