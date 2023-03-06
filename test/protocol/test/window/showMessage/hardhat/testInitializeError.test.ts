import { expect } from 'chai'
import { test } from 'mocha'
import { MessageType } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] show notification', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.clear()
    client.closeAllDocuments()
  })

  test('on failed initialization', async () => {
    const documentPath = getProjectPath('hardhat_invalid_config/contracts/Test.sol')

    await client.openDocument(documentPath)

    const notification = await client.getOrWaitNotification('window/showMessage', {
      type: MessageType.Error,
    })

    expect(notification.message).to.match(
      /Hardhat project 'hardhat_invalid_config' was not able to initialize correctly/
    )
  })
})
