import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] typeDefinition - file-level', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('foundry/src/type-definition/file-level/FlDefs.sol')
    userPath = getProjectPath('foundry/src/type-definition/file-level/FlUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('free function parameter used in the body', async () => {
    const locations = await client.findTypeDefinition(toUri(defsPath), makePosition(30, 12))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(15, 7, 15, 12) }]))
  })

  test('struct member accessed in a free function', async () => {
    const locations = await client.findTypeDefinition(toUri(defsPath), makePosition(30, 14))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(3, 7, 3, 14) }]))
  })

  test('named return of a free function used in the body', async () => {
    const locations = await client.findTypeDefinition(toUri(defsPath), makePosition(38, 4))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(15, 7, 15, 12) }]))
  })

  test('file-level constant of a user-defined value type', async () => {
    const locations = await client.findTypeDefinition(toUri(defsPath), makePosition(40, 17))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(13, 5, 13, 13) }]))
  })

  test('imported free function call returning a struct', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(15, 31))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(3, 7, 3, 14) }]))
  })

  test('state variable of an imported struct type', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(17, 23))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(15, 7, 15, 12) }]))
  })

  test('local of an imported enum type at its declaration', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(17, 16))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(8, 5, 8, 12) }]))
  })

  test('imported free function call returning a user-defined value type', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(25, 21))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(13, 5, 13, 13) }]))
  })

  test('imported file-level constant of a user-defined value type', async () => {
    const locations = await client.findTypeDefinition(toUri(userPath), makePosition(27, 39))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(defsPath), range: makeRange(13, 5, 13, 13) }]))
  })
})
