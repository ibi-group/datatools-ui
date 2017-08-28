// @flow

/**
 * Helper function to make flow deal with possibly null document.body
 *
 * @param  {Function} fn [description]
 */
function safeBodyAction (fn: Function) {
  if (document.body) {
    fn(document.body)
  } else {
    console.error('document.body is not available')
  }
}

export default function fileDownload (data: any, filename: string, type: string) {
  const blob = new window.Blob([data], {type})
  if (typeof window.navigator.msSaveBlob !== 'undefined') {
    // IE workaround for "HTML7007: One or more blob URLs were
    // revoked by closing the blob for which they were created.
    // These URLs will no longer resolve as the data backing
    // the URL has been freed."
    window.navigator.msSaveBlob(blob, filename)
  } else {
    if (!document.body) {
      throw new Error('Webpage not initiated properly')
    }
    const csvURL = window.URL.createObjectURL(blob)
    const tempLink = document.createElement('a')
    tempLink.href = csvURL
    tempLink.setAttribute('download', filename)
    tempLink.setAttribute('target', '_blank')
    safeBodyAction((body) => body.appendChild(tempLink))
    tempLink.click()
    safeBodyAction((body) => body.removeChild(tempLink))
  }
}
