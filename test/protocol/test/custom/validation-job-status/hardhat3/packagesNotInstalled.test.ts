import { test } from 'mocha'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] custom/validation-job-status', () => {
  before(async () => {
    client = await getInitializedClient()
  })
  after(async () => {
    await client.closeAllDocuments()
  })

  test('project failed to initialize: packages not installed', async () => {
    const filePath = getProjectPath('hardhat3_no_packages/contracts/Test.sol')
    await client.openDocument(filePath)
    await client.getOrWaitNotification('custom/validation-job-status', {
      validationRun: false,
      reason: "Couldn't load the local installation of hardhat 3. Make sure packages are installed.",
    })
  })
})
