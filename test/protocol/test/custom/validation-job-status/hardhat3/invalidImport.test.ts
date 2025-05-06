import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
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

  test('invalid import on hardhat dependency chain sends a custom notification with link to error file', async () => {
    const importerPath = getProjectPath('hardhat3/contracts/custom/validation-job-status/Importer.sol')
    const invalidImportPath = getProjectPath('hardhat3/contracts/custom/validation-job-status/InvalidImport.sol')

    await client.openDocument(importerPath)

    const expectedData = {
      validationRun: false,
      reason:
        'HHE902: The import "./nonexistent.sol from "projects/hardhat3/contracts/custom/validation-job-status/InvalidImport.sol" doesn\'t exist.',
      displayText:
        'HHE902: The import "./nonexistent.sol from "projects/hardhat3/contracts/custom/validation-job-status/InvalidImport.sol" doesn\'t exist.',
      errorFile: toUri(invalidImportPath),
    }

    await client.getOrWaitNotification('custom/validation-job-status', expectedData, 10000)
  })
})
