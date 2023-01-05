import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] custom/validation-job-status', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('invalid import on hardhat dependency chain sends a custom notification with link to error file', async () => {
    const importerPath = getProjectPath('hardhat/contracts/custom/validation-job-status/Importer.sol')
    const invalidImportPath = getProjectPath('hardhat/contracts/custom/validation-job-status/InvalidImport.sol')

    await client.openDocument(importerPath)

    const expectedData = {
      validationRun: false,
      reason: 'Imported file not found',
      displayText: 'Imported file not found',
      errorFile: toUri(invalidImportPath),
    }

    await client.getOrWaitCustomNotification('custom/validation-job-status', expectedData)
  })
})
