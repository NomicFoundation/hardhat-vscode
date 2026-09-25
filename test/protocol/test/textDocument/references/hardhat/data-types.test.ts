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

describe('[hardhat] references - data-types', () => {
  let dataTypesPath: string
  let membersPath: string

  before(async () => {
    client = await getInitializedClient()
    dataTypesPath = getProjectPath('hardhat/contracts/definition/data-types/DataTypes.sol')
    membersPath = getProjectPath('hardhat/contracts/references/data-types/DtMembers.sol')

    await client.openDocument(dataTypesPath)
    await client.openDocument(membersPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('struct type from a named struct constructor', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(38, 25))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(15, 11, 15, 16) },
        { uri: toUri(dataTypesPath), range: makeRange(20, 4, 20, 9) },
        { uri: toUri(dataTypesPath), range: makeRange(21, 42, 21, 47) },
        { uri: toUri(dataTypesPath), range: makeRange(24, 21, 24, 26) },
        { uri: toUri(dataTypesPath), range: makeRange(37, 8, 37, 13) },
        { uri: toUri(dataTypesPath), range: makeRange(37, 25, 37, 30) },
        { uri: toUri(dataTypesPath), range: makeRange(38, 8, 38, 13) },
        { uri: toUri(dataTypesPath), range: makeRange(38, 25, 38, 30) },
        { uri: toUri(dataTypesPath), range: makeRange(46, 44, 46, 49) },
        { uri: toUri(dataTypesPath), range: makeRange(47, 15, 47, 20) },
      ])
    )
  })

  test('nested struct member from its declaration', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(12, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(12, 16, 12, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(25, 29, 25, 30) },
      ])
    )
  })

  test('nested struct member from a chained member access', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(25, 29))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(12, 16, 12, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(25, 29, 25, 30) },
      ])
    )
  })

  test('enum type from its declaration', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(6, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(6, 9, 6, 14) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 45, 50, 50) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 52, 50, 57) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 59, 50, 64) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 16, 51, 21) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 32, 51, 37) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 49, 51, 54) },
      ])
    )
  })

  test('enum type from type(e).max', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(51, 49))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(6, 9, 6, 14) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 45, 50, 50) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 52, 50, 57) },
        { uri: toUri(dataTypesPath), range: makeRange(50, 59, 50, 64) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 16, 51, 21) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 32, 51, 37) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 49, 51, 54) },
      ])
    )
  })

  test('enum member from its declaration', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(7, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(7, 8, 7, 11) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 22, 51, 25) },
      ])
    )
  })

  test('enum member from a qualified use', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(51, 22))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(7, 8, 7, 11) },
        { uri: toUri(dataTypesPath), range: makeRange(51, 22, 51, 25) },
      ])
    )
  })

  test('struct member from its declaration, not a same-named member of another struct', async () => {
    const locations = await client.findReferences(toUri(membersPath), makePosition(5, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(membersPath), range: makeRange(5, 16, 5, 17) },
        { uri: toUri(membersPath), range: makeRange(20, 25, 20, 26) },
        { uri: toUri(membersPath), range: makeRange(20, 37, 20, 38) },
        { uri: toUri(membersPath), range: makeRange(20, 48, 20, 49) },
        { uri: toUri(membersPath), range: makeRange(24, 15, 24, 16) },
        { uri: toUri(membersPath), range: makeRange(25, 25, 25, 26) },
      ])
    )
  })

  test('struct member from an array element access', async () => {
    const locations = await client.findReferences(toUri(membersPath), makePosition(20, 37))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(membersPath), range: makeRange(5, 16, 5, 17) },
        { uri: toUri(membersPath), range: makeRange(20, 25, 20, 26) },
        { uri: toUri(membersPath), range: makeRange(20, 37, 20, 38) },
        { uri: toUri(membersPath), range: makeRange(20, 48, 20, 49) },
        { uri: toUri(membersPath), range: makeRange(24, 15, 24, 16) },
        { uri: toUri(membersPath), range: makeRange(25, 25, 25, 26) },
      ])
    )
  })
})
