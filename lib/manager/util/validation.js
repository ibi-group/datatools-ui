// @flow

/**
 * Checks if a filename is valid.
 * A valid filename does not contain <>:"/\|?* characters and does not end with .zip (case-insensitive).
 * An empty or null/undefined filename is also considered valid.
 */
export function isValidFilename (filename: ?string): boolean {
  return !filename || (/^[^<>:"/\\|?* ]*$/.test(filename) && !/\.zip$/i.test(filename))
}
