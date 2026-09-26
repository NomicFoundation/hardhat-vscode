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

describe('[foundry] typeDefinition bug - bare call binds to the first-declared overload', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let overloadsPath: string

  before(async () => {
    client = await getInitializedClient()
    overloadsPath = getProjectPath('foundry/src/type-definition/bugs/overload-resolution/FnOverloads.sol')

    await client.openDocument(overloadsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the first overload's return type FnOvSmall (3:7-3:16).
  test.skip('call to the overload declared second gives its return type', async () => {
    const locations = await client.findTypeDefinition(toUri(overloadsPath), makePosition(22, 33))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(overloadsPath), range: makeRange(7, 7, 7, 16) }]))
  })
})
