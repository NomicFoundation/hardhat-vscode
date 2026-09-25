import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// A type definition can have several locations (a function's return types, say): compare them as
// sets. The server answers with plain locations, never links.
function sorted(result: Definition | DefinitionLink[] | null) {
  const locations = (result === null ? [] : Array.isArray(result) ? result : [result]) as Location[]

  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat3] typeDefinition - file-level (not implemented)', () => {
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('hardhat3/contracts/type-definition/file-level/FlDefs.sol')
    userPath = getProjectPath('hardhat3/contracts/type-definition/file-level/FlUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no locations.
  test.skip('function attached with a file-level using directive', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(24, 31))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(13, 5, 13, 13) }]))
  })
})
