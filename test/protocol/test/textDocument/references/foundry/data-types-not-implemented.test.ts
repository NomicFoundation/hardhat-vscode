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

describe('[foundry] references - data-types (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let dataTypesPath: string
  let registryPath: string

  before(async () => {
    client = await getInitializedClient()
    dataTypesPath = getProjectPath('foundry/src/definition/data-types/DataTypes.sol')
    registryPath = getProjectPath('foundry/src/definition/data-types/Registry.sol')

    await client.openDocument(dataTypesPath)
    await client.openDocument(registryPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: omits the uses through nested mapping indexes, push() and a function's return value.
  test.skip('struct member from its declaration, through every access path', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(16, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(16, 16, 16, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(25, 17, 25, 18) },
        { uri: toUri(dataTypesPath), range: makeRange(29, 37, 29, 38) },
        { uri: toUri(dataTypesPath), range: makeRange(33, 22, 33, 23) },
        { uri: toUri(dataTypesPath), range: makeRange(38, 32, 38, 33) },
        { uri: toUri(dataTypesPath), range: makeRange(39, 17, 39, 18) },
        { uri: toUri(dataTypesPath), range: makeRange(39, 23, 39, 24) },
        { uri: toUri(dataTypesPath), range: makeRange(43, 23, 43, 24) },
      ])
    )
  })

  // Not implemented: omits the uses through nested mapping indexes, push() and a function's return value.
  test.skip('struct member from a member access on a parameter', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(25, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(dataTypesPath), range: makeRange(16, 16, 16, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(25, 17, 25, 18) },
        { uri: toUri(dataTypesPath), range: makeRange(29, 37, 29, 38) },
        { uri: toUri(dataTypesPath), range: makeRange(33, 22, 33, 23) },
        { uri: toUri(dataTypesPath), range: makeRange(38, 32, 38, 33) },
        { uri: toUri(dataTypesPath), range: makeRange(39, 17, 39, 18) },
        { uri: toUri(dataTypesPath), range: makeRange(39, 23, 39, 24) },
        { uri: toUri(dataTypesPath), range: makeRange(43, 23, 43, 24) },
      ])
    )
  })

  // Not implemented: omits the use in the qualified type name Registry.Entry of a declaration.
  test.skip('struct of another contract from its declaration', async () => {
    const locations = await client.findReferences(toUri(registryPath), makePosition(9, 11))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(registryPath), range: makeRange(9, 11, 9, 16) },
        { uri: toUri(dataTypesPath), range: makeRange(55, 17, 55, 22) },
        { uri: toUri(dataTypesPath), range: makeRange(55, 43, 55, 48) },
      ])
    )
  })

  // Not implemented: omits the use in the qualified type name Registry.Entry of a declaration.
  test.skip('struct of another contract from a qualified constructor call', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(55, 43))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(registryPath), range: makeRange(9, 11, 9, 16) },
        { uri: toUri(dataTypesPath), range: makeRange(55, 17, 55, 22) },
        { uri: toUri(dataTypesPath), range: makeRange(55, 43, 55, 48) },
      ])
    )
  })

  // Not implemented: returns only the declaration; e.kind on a Registry.Entry local is not linked.
  test.skip('member of a struct in another contract from its declaration', async () => {
    const locations = await client.findReferences(toUri(registryPath), makePosition(10, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(registryPath), range: makeRange(10, 13, 10, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(56, 17, 56, 21) },
      ])
    )
  })

  // Not implemented: returns []; e.kind on a Registry.Entry local is not linked.
  test.skip('member of a struct in another contract from a member access', async () => {
    const locations = await client.findReferences(toUri(dataTypesPath), makePosition(56, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(registryPath), range: makeRange(10, 13, 10, 17) },
        { uri: toUri(dataTypesPath), range: makeRange(56, 17, 56, 21) },
      ])
    )
  })
})
