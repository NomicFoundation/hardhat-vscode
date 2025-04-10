import { test } from 'mocha'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[projectless] custom/file-indexed', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  test('after initialization, a notification is received with the indexed file uri and project', async () => {
    const contractPath = getProjectPath('projectless/src/codeAction/NoLicense.sol')

    const expectedData = {
      uri: contractPath,
      project: { frameworkName: 'None' },
    }

    await client.getOrWaitNotification('custom/file-indexed', expectedData)
  })
})
