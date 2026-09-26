import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[foundry] typeDefinition bug - unnamed return parameters keep only the last return type', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('foundry/src/type-definition/file-level/FlDefs.sol')

    await client.openDocument(defsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only the last return type, FlShade (8:5-8:12).
  test.skip('free function with two unnamed user-defined returns, at its name', async () => {
    const locations = await client.findTypeDefinition(toUri(defsPath), makePosition(29, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(3, 7, 3, 14) },
        { uri: toUri(defsPath), range: makeRange(8, 5, 8, 12) },
      ])
    )
  })
})
