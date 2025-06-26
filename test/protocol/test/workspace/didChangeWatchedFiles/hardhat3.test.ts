import { readFileSync, writeFileSync } from 'fs'
import { expect } from 'chai'
import { getProjectPath, makeRange } from '../../helpers'
import { TestLanguageClient } from '../../../src/TestLanguageClient'
import { getInitializedClient } from '../../client'
import { toUri } from '../../../src/helpers'

let client!: TestLanguageClient

describe('[hardhat3] onDidChangeWatchedFiles', () => {
  describe('hardhat.config file change', () => {
    const configPath = getProjectPath('hardhat3/hardhat.config.ts')
    const originalConfigContents = readFileSync(configPath).toString()

    beforeEach(async () => {
      client = await getInitializedClient()
    })

    afterEach(async () => {
      // After the test is done, restore the original config file
      writeFileSync(configPath, originalConfigContents)
    })

    it('should reinitialize the project', async () => {
      // Open the contract file that uses a solidity version that matches config, there should be no errors
      const contractPath = getProjectPath('hardhat3/contracts/workspace/onDidChangeWatchedFiles/ConfigReloadTest.sol')
      const document = await client.openDocument(contractPath)

      // There should be no error status items at this point
      expect(
        client
          .getNotifications('custom/validation-job-status')
          .some((notification) => notification.validationRun === false)
      ).to.eq(false)

      // Modify the config file, removing the supported version
      const modifiedConfigContents = originalConfigContents.replace(`{ version: '0.7.0' }`, '')
      writeFileSync(configPath, modifiedConfigContents)

      // Send the config change event
      client.clear()
      await client.changeWatchedFiles({ changes: [{ uri: toUri(configPath), type: 2 }] })

      // Wait for the project to be reinitialized
      await client.getOrWaitNotification('custom/projectInitialized', { configPath }, 2000)

      // Trigger validation on the document
      await client.changeDocument(contractPath, makeRange(0, 0, 0, 0), '')
      await document.waitValidated

      // Now there should be a status item with the version error
      await client.getOrWaitNotification(
        'custom/validation-job-status',
        {
          projectBasePath: getProjectPath('hardhat3'),
          validationRun: false,
        },
        2000
      )
    })
  })
})
