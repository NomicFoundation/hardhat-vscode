import { Context } from 'mocha'
import { getInitializedClient } from './client'

// Starting the server indexes every fixture project and downloads compilers, which on a slow
// runner takes longer than one test's timeout. Start it once here, before any test file.
export const mochaHooks = {
  async beforeAll(this: Context) {
    this.timeout(180000)

    await getInitializedClient()
  },
}
