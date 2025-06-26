import { test } from 'mocha'
import path from 'path'
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

    const importerSubpath = [
      '.',
      'projects',
      'hardhat3',
      'contracts',
      'custom',
      'validation-job-status',
      'InvalidImport.sol',
    ].join(path.sep)

    const expectedData = {
      validationRun: false,
      reason: `HHE902: There was an error while resolving the import "./nonexistent.sol" from "${importerSubpath}":\n\nThe file contracts/custom/validation-job-status/nonexistent.sol doesn't exist within the project.`,
      displayText: `HHE902: There was an error while resolving the import "./nonexistent.sol" from "${importerSubpath}":\n\nThe file contracts/custom/validation-job-status/nonexistent.sol doesn't exist within the project.`,
      errorFile: toUri(invalidImportPath),
    }

    await client.getOrWaitNotification('custom/validation-job-status', expectedData, 5000)
  })
})
