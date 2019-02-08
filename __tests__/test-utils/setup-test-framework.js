// This file is ran before each test within the testing environemnt.  This is
// needed when running with units tests because localStorage isn't implemented
// in an expected way within jsdom.  This test also runs during the e2e tests,
// so we need to make sure the window variable is present.

if (typeof window !== 'undefined') {
  window.localStorage = {
    getItem: () => null
  }
}
