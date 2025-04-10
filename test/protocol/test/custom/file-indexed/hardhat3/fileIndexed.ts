import { test } from 'mocha'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] custom/file-indexed', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  test('after initialization, a notification is received with the indexed file uri and project', async () => {
    const contractPath = getProjectPath('hardhat3/contracts/codeAction/NoPragma.sol')

    const expectedData = {
      uri: contractPath,
      project: { frameworkName: 'Hardhat 3', configPath: getProjectPath('hardhat3/hardhat.config.ts') },
    }

    await client.getOrWaitNotification('custom/file-indexed', expectedData)
  })
})
