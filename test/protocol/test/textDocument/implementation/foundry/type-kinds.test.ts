import { expect } from 'chai'
import { test } from 'mocha'
import { Definition, DefinitionLink, Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// Implementations come in no particular order: compare them as sets. The server answers with plain
// locations, never links.
function sorted(result: Definition | DefinitionLink[] | null) {
  const locations = (result === null ? [] : Array.isArray(result) ? result : [result]) as Location[]

  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[foundry] implementation - type-kinds', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let typesPath: string
  let shapesPath: string
  let otherPath: string

  before(async () => {
    client = await getInitializedClient()
    typesPath = getProjectPath('foundry/src/implementation/type-kinds/TkTypes.sol')
    shapesPath = getProjectPath('foundry/src/implementation/type-kinds/TkShapes.sol')
    otherPath = getProjectPath('foundry/src/implementation/type-kinds/TkOther.sol')

    await client.openDocument(typesPath)
    await client.openDocument(shapesPath)
    await client.openDocument(otherPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('file-level struct from its name, with type names in three files', async () => {
    const locations = await client.findImplementations(toUri(typesPath), makePosition(3, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(3, 7, 3, 14) },
        { uri: toUri(typesPath), range: makeRange(9, 4, 9, 11) },
        { uri: toUri(typesPath), range: makeRange(10, 4, 10, 11) },
        { uri: toUri(typesPath), range: makeRange(22, 34, 22, 41) },
        { uri: toUri(shapesPath), range: makeRange(12, 4, 12, 11) },
        { uri: toUri(shapesPath), range: makeRange(13, 23, 13, 30) },
        { uri: toUri(shapesPath), range: makeRange(19, 18, 19, 25) },
        { uri: toUri(shapesPath), range: makeRange(19, 55, 19, 62) },
        { uri: toUri(shapesPath), range: makeRange(21, 8, 21, 15) },
        { uri: toUri(otherPath), range: makeRange(15, 8, 15, 15) },
      ])
    )
  })

  test("file-level struct from a local's type name in another file", async () => {
    const locations = await client.findImplementations(toUri(otherPath), makePosition(15, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(3, 7, 3, 14) },
        { uri: toUri(typesPath), range: makeRange(9, 4, 9, 11) },
        { uri: toUri(typesPath), range: makeRange(10, 4, 10, 11) },
        { uri: toUri(typesPath), range: makeRange(22, 34, 22, 41) },
        { uri: toUri(shapesPath), range: makeRange(12, 4, 12, 11) },
        { uri: toUri(shapesPath), range: makeRange(13, 23, 13, 30) },
        { uri: toUri(shapesPath), range: makeRange(19, 18, 19, 25) },
        { uri: toUri(shapesPath), range: makeRange(19, 55, 19, 62) },
        { uri: toUri(shapesPath), range: makeRange(21, 8, 21, 15) },
        { uri: toUri(otherPath), range: makeRange(15, 8, 15, 15) },
      ])
    )
  })

  test('enum from its name', async () => {
    const locations = await client.findImplementations(toUri(typesPath), makePosition(13, 6))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(13, 5, 13, 12) },
        { uri: toUri(shapesPath), range: makeRange(14, 4, 14, 11) },
        { uri: toUri(shapesPath), range: makeRange(27, 19, 27, 26) },
        { uri: toUri(shapesPath), range: makeRange(27, 48, 27, 55) },
      ])
    )
  })

  test('enum from a member access in another file', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(29, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(13, 5, 13, 12) },
        { uri: toUri(shapesPath), range: makeRange(14, 4, 14, 11) },
        { uri: toUri(shapesPath), range: makeRange(27, 19, 27, 26) },
        { uri: toUri(shapesPath), range: makeRange(27, 48, 27, 55) },
      ])
    )
  })

  test('user-defined value type from its name, unnamed returns included', async () => {
    const locations = await client.findImplementations(toUri(typesPath), makePosition(18, 6))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(18, 5, 18, 12) },
        { uri: toUri(typesPath), range: makeRange(26, 18, 26, 25) },
        { uri: toUri(typesPath), range: makeRange(26, 47, 26, 54) },
        { uri: toUri(shapesPath), range: makeRange(15, 4, 15, 11) },
        { uri: toUri(shapesPath), range: makeRange(34, 8, 34, 15) },
        { uri: toUri(otherPath), range: makeRange(20, 20, 20, 27) },
        { uri: toUri(otherPath), range: makeRange(20, 54, 20, 61) },
      ])
    )
  })

  test('user-defined value type from the type name of a wrap call in another file', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(34, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(18, 5, 18, 12) },
        { uri: toUri(typesPath), range: makeRange(26, 18, 26, 25) },
        { uri: toUri(typesPath), range: makeRange(26, 47, 26, 54) },
        { uri: toUri(shapesPath), range: makeRange(15, 4, 15, 11) },
        { uri: toUri(shapesPath), range: makeRange(34, 8, 34, 15) },
        { uri: toUri(otherPath), range: makeRange(20, 20, 20, 27) },
        { uri: toUri(otherPath), range: makeRange(20, 54, 20, 61) },
      ])
    )
  })

  test('error from its name gives the declaration', async () => {
    const locations = await client.findImplementations(toUri(typesPath), makePosition(20, 7))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(typesPath), range: makeRange(20, 6, 20, 14) }]))
  })

  test('error from a revert in another file gives the declaration', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(29, 40))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(typesPath), range: makeRange(20, 6, 20, 14) }]))
  })

  test('contract-level event from an emit gives the declaration', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(24, 14))

    expect(sorted(locations)).to.deep.equal(sorted([{ uri: toUri(shapesPath), range: makeRange(10, 10, 10, 15) }]))
  })

  test('contract-level struct from a use, excluding a same-named struct', async () => {
    const locations = await client.findImplementations(toUri(otherPath), makePosition(11, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(otherPath), range: makeRange(7, 11, 7, 16) },
        { uri: toUri(otherPath), range: makeRange(11, 4, 11, 9) },
        { uri: toUri(otherPath), range: makeRange(14, 77, 14, 82) },
      ])
    )
  })

  test('concrete contract from its name, new expression included', async () => {
    const locations = await client.findImplementations(toUri(typesPath), makePosition(30, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(30, 9, 30, 16) },
        { uri: toUri(shapesPath), range: makeRange(16, 4, 16, 11) },
        { uri: toUri(shapesPath), range: makeRange(38, 20, 38, 27) },
        { uri: toUri(shapesPath), range: makeRange(40, 8, 40, 15) },
        { uri: toUri(shapesPath), range: makeRange(40, 28, 40, 35) },
      ])
    )
  })

  test('concrete contract from a parameter type', async () => {
    const locations = await client.findImplementations(toUri(shapesPath), makePosition(38, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(typesPath), range: makeRange(30, 9, 30, 16) },
        { uri: toUri(shapesPath), range: makeRange(16, 4, 16, 11) },
        { uri: toUri(shapesPath), range: makeRange(38, 20, 38, 27) },
        { uri: toUri(shapesPath), range: makeRange(40, 8, 40, 15) },
        { uri: toUri(shapesPath), range: makeRange(40, 28, 40, 35) },
      ])
    )
  })

  test('concrete contract from a parameter type in another file, without the qualifier in TkShapes.Inner', async () => {
    const locations = await client.findImplementations(toUri(otherPath), makePosition(14, 43))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(shapesPath), range: makeRange(5, 9, 5, 17) },
        { uri: toUri(otherPath), range: makeRange(14, 42, 14, 50) },
      ])
    )
  })
})
