import { expect } from 'chai'
import { shouldSkipFoundryTests, toUri } from '../../src/helpers'
import { TestLanguageClient } from '../../src/TestLanguageClient'
import { getInitializedClient } from '../client'
import { getProjectPath } from '../helpers'

let client!: TestLanguageClient

describe('[misc] server document formatting', () => {
  const filePath = getProjectPath('formatting/src/FormattingTest.sol')
  const fileUri = toUri(filePath)

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  it('can use prettier as formatter', async () => {
    const doc = await client.openDocument(filePath)
    expect(doc.text).to.eq('contract Formatting {\nuint256 counter;\n}\n')

    // Set prettier as the formatter
    await client.changeExtensionConfig({ formatter: 'prettier' })

    // Trigger formatting. Prettier is set to use 4 tabs on prettierrc.json
    const edits = await client.formatDocument(fileUri)

    expect(edits![0].newText).to.eq('contract Formatting {\n    uint256 counter;\n}\n')
  })

  it('can use forge as formatter', async () => {
    if (shouldSkipFoundryTests()) {
      return
    }

    const doc = await client.openDocument(filePath)
    expect(doc.text).to.eq('contract Formatting {\nuint256 counter;\n}\n')

    // Set forge as the formatter
    await client.changeExtensionConfig({ formatter: 'forge' })

    // Trigger formatting. Forge is set to use 2 tabs in foundry.toml
    const edits = await client.formatDocument(fileUri)

    expect(edits![0].newText).to.eq('contract Formatting {\n  uint256 counter;\n}\n')
  })

  it('doesnt format the document if formatter is set to none', async () => {
    const doc = await client.openDocument(filePath)
    expect(doc.text).to.eq('contract Formatting {\nuint256 counter;\n}\n')

    // Set formatter to none
    await client.changeExtensionConfig({ formatter: 'none' })

    // Trigger formatting
    const edits = await client.formatDocument(fileUri)

    expect(edits).to.eq(null)
  })

  it('uses prettier by default if config.formatter is not present', async () => {
    const doc = await client.openDocument(filePath)
    expect(doc.text).to.eq('contract Formatting {\nuint256 counter;\n}\n')

    // Set empty extension config
    await client.changeExtensionConfig({})

    // Trigger formatting. Prettier should be used (4 tabs)
    const edits = await client.formatDocument(fileUri)

    expect(edits![0].newText).to.eq('contract Formatting {\n    uint256 counter;\n}\n')
  })
})
