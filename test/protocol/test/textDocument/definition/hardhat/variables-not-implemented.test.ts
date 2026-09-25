import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - variables (not implemented)', () => {
  let layoutPath: string

  before(async () => {
    client = await getInitializedClient()
    layoutPath = getProjectPath('hardhat/contracts/definition/variables/LayoutConstants.sol')

    await client.openDocument(layoutPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('file-level constant in a layout at base-slot expression', async () => {
    const location = await client.findDefinition(toUri(layoutPath), makePosition(8, 30))

    expect(location).to.deep.equal({
      uri: toUri(layoutPath),
      range: makeRange(4, 17, 4, 29),
    })
  })

  // Not implemented: returns null.
  test.skip('file-level constant passed to erc7201 in a layout at expression', async () => {
    const location = await client.findDefinition(toUri(layoutPath), makePosition(12, 37))

    expect(location).to.deep.equal({
      uri: toUri(layoutPath),
      range: makeRange(5, 16, 5, 25),
    })
  })
})
