import { test } from 'mocha'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, toUnixStyle } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] custom/file-indexed', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  test('after initialization, a notification is received with the indexed file uri and project', async () => {
    const contractPath = getProjectPath('hardhat/contracts/codeAction/NoPragma.sol')

    const expectedData = {
      uri: toUnixStyle(contractPath),
      project: { frameworkName: 'Hardhat', configPath: toUnixStyle(getProjectPath('hardhat/hardhat.config.ts')) },
    }

    await client.getOrWaitNotification('custom/file-indexed', expectedData)
  })
})
