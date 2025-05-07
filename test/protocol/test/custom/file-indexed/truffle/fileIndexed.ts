import { test } from 'mocha'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, toUnixStyle } from '../../../helpers'

let client!: TestLanguageClient

describe('[truffle] custom/file-indexed', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  test('after initialization, a notification is received with the indexed file uri and project', async () => {
    const contractPath = toUnixStyle(getProjectPath('truffle/my_contracts/codeAction/NoLicense.sol'))

    const expectedData = {
      uri: contractPath,
      project: { frameworkName: 'Truffle', configPath: toUnixStyle(getProjectPath('truffle/truffle-config.js')) },
    }

    await client.getOrWaitNotification('custom/file-indexed', expectedData)
  })
})
