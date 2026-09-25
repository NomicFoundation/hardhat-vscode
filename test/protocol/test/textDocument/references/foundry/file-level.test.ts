import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] references - file-level', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let refDefsPath: string
  let refUserPath: string
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    refDefsPath = getProjectPath('foundry/src/references/file-level/FlRefDefs.sol')
    refUserPath = getProjectPath('foundry/src/references/file-level/FlRefUser.sol')
    defsPath = getProjectPath('foundry/src/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('foundry/src/definition/file-level/FileLevelUser.sol')

    await client.openDocument(refDefsPath)
    await client.openDocument(refUserPath)
    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract function shadowing a free function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refDefsPath), makePosition(17, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refDefsPath), range: makeRange(17, 13, 17, 20) },
        { uri: toUri(refDefsPath), range: makeRange(23, 15, 23, 22) },
      ])
    )
  })

  test('contract function shadowing a free function, from a call', async () => {
    const locations = await client.findReferences(toUri(refDefsPath), makePosition(23, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refDefsPath), range: makeRange(17, 13, 17, 20) },
        { uri: toUri(refDefsPath), range: makeRange(23, 15, 23, 22) },
      ])
    )
  })

  test('constant imported under an alias, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refDefsPath), makePosition(3, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refDefsPath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(refDefsPath), range: makeRange(7, 15, 7, 23) },
        { uri: toUri(refUserPath), range: makeRange(3, 8, 3, 16) },
        { uri: toUri(refUserPath), range: makeRange(3, 20, 3, 26) },
        { uri: toUri(refUserPath), range: makeRange(6, 15, 6, 21) },
        { uri: toUri(refUserPath), range: makeRange(6, 24, 6, 30) },
        { uri: toUri(refUserPath), range: makeRange(11, 37, 11, 43) },
      ])
    )
  })

  test('constant imported under an alias, from a use of the alias', async () => {
    const locations = await client.findReferences(toUri(refUserPath), makePosition(11, 38))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refDefsPath), range: makeRange(3, 17, 3, 25) },
        { uri: toUri(refDefsPath), range: makeRange(7, 15, 7, 23) },
        { uri: toUri(refUserPath), range: makeRange(3, 8, 3, 16) },
        { uri: toUri(refUserPath), range: makeRange(3, 20, 3, 26) },
        { uri: toUri(refUserPath), range: makeRange(6, 15, 6, 21) },
        { uri: toUri(refUserPath), range: makeRange(6, 24, 6, 30) },
        { uri: toUri(refUserPath), range: makeRange(11, 37, 11, 43) },
      ])
    )
  })

  test('file-level struct, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(5, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(5, 7, 5, 12) },
        { uri: toUri(defsPath), range: makeRange(27, 15, 27, 20) },
        { uri: toUri(defsPath), range: makeRange(27, 56, 27, 61) },
        { uri: toUri(defsPath), range: makeRange(28, 11, 28, 16) },
        { uri: toUri(defsPath), range: makeRange(31, 13, 31, 18) },
        { uri: toUri(defsPath), range: makeRange(36, 23, 36, 28) },
        { uri: toUri(defsPath), range: makeRange(41, 16, 41, 21) },
        { uri: toUri(defsPath), range: makeRange(49, 19, 49, 24) },
        { uri: toUri(userPath), range: makeRange(5, 23, 5, 28) },
        { uri: toUri(userPath), range: makeRange(6, 19, 6, 24) },
        { uri: toUri(userPath), range: makeRange(11, 18, 11, 23) },
        { uri: toUri(userPath), range: makeRange(13, 8, 13, 13) },
      ])
    )
  })

  test('file-level struct, from a parameter type in another file', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(11, 19))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(5, 7, 5, 12) },
        { uri: toUri(defsPath), range: makeRange(27, 15, 27, 20) },
        { uri: toUri(defsPath), range: makeRange(27, 56, 27, 61) },
        { uri: toUri(defsPath), range: makeRange(28, 11, 28, 16) },
        { uri: toUri(defsPath), range: makeRange(31, 13, 31, 18) },
        { uri: toUri(defsPath), range: makeRange(36, 23, 36, 28) },
        { uri: toUri(defsPath), range: makeRange(41, 16, 41, 21) },
        { uri: toUri(defsPath), range: makeRange(49, 19, 49, 24) },
        { uri: toUri(userPath), range: makeRange(5, 23, 5, 28) },
        { uri: toUri(userPath), range: makeRange(6, 19, 6, 24) },
        { uri: toUri(userPath), range: makeRange(11, 18, 11, 23) },
        { uri: toUri(userPath), range: makeRange(13, 8, 13, 13) },
      ])
    )
  })

  test('file-level enum, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(10, 6))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(10, 5, 10, 10) },
        { uri: toUri(userPath), range: makeRange(9, 4, 9, 9) },
        { uri: toUri(userPath), range: makeRange(9, 25, 9, 30) },
      ])
    )
  })

  test('file-level enum, from a member access in another file', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(9, 26))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(10, 5, 10, 10) },
        { uri: toUri(userPath), range: makeRange(9, 4, 9, 9) },
        { uri: toUri(userPath), range: makeRange(9, 25, 9, 30) },
      ])
    )
  })

  test('file-level event, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(17, 7))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(17, 6, 17, 11) },
        { uri: toUri(userPath), range: makeRange(14, 13, 14, 18) },
      ])
    )
  })

  test('file-level event, from an emit in another file', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(14, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(17, 6, 17, 11) },
        { uri: toUri(userPath), range: makeRange(14, 13, 14, 18) },
      ])
    )
  })
})
