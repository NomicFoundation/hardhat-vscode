import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// References come in no particular order: compare them as sets.
function sorted(locations: Location[]) {
  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat] references - variables (not implemented)', () => {
  let layoutPath: string

  before(async () => {
    client = await getInitializedClient()
    layoutPath = getProjectPath('hardhat/contracts/definition/variables/LayoutConstants.sol')

    await client.openDocument(layoutPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration and the initializer use; the use in layout at is not linked.
  test.skip('file-level constant used in a layout at expression', async () => {
    const locations = await client.findReferences(toUri(layoutPath), makePosition(3, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(layoutPath), range: makeRange(3, 17, 3, 26) },
        { uri: toUri(layoutPath), range: makeRange(4, 32, 4, 41) },
        { uri: toUri(layoutPath), range: makeRange(16, 54, 16, 63) },
      ])
    )
  })

  // Not implemented: returns []; identifiers in layout at are not linked.
  test.skip('constant used as the erc7201 argument in a layout at expression', async () => {
    const locations = await client.findReferences(toUri(layoutPath), makePosition(12, 37))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(layoutPath), range: makeRange(5, 16, 5, 25) },
        { uri: toUri(layoutPath), range: makeRange(6, 42, 6, 51) },
        { uri: toUri(layoutPath), range: makeRange(12, 37, 12, 46) },
      ])
    )
  })
})
