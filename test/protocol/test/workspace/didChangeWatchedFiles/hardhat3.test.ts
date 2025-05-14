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
      // Open the contract file that uses an import through remapping, there should be no diagnostics
      const contractPath = getProjectPath('hardhat3/contracts/workspace/onDidChangeWatchedFiles/ConfigReloadTest.sol')
      const document = await client.openDocument(contractPath)
      expect(document.diagnostics).to.deep.equal([])

      // Modify the config file, removing the required remapping
      const modifiedConfigContents = originalConfigContents.replace(
        'pkg_without_exports_2_through_remapping/',
        'foobar/'
      )
      writeFileSync(configPath, modifiedConfigContents)

      // Send the config change event
      client.clear()
      await client.changeWatchedFiles({ changes: [{ uri: toUri(configPath), type: 2 }] })

      // Wait for the project to be reinitialized
      await client.getOrWaitNotification('custom/projectInitialized', { configPath }, 2000)

      // Trigger validation on the document
      await client.changeDocument(contractPath, makeRange(0, 0, 0, 0), '')
      await document.waitValidated

      // Now there should be a diagnostic with invalid import
      expect(document.diagnostics[0]).to.deep.include({
        severity: 1,
        source: 'hardhat',
        code: 906,
        range: {
          start: {
            line: 9,
            character: 8,
          },
          end: {
            line: 9,
            character: 53,
          },
        },
      })
    })
  })
})
