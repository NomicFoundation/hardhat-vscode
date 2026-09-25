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

describe('[hardhat3] references - functions (not implemented)', () => {
  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('hardhat3/contracts/definition/functions/Functions.sol')
    libPath = getProjectPath('hardhat3/contracts/definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration; a function named as a value is not linked.
  test.skip('internal function used as a value, from its declaration', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(16, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(16, 13, 16, 19) },
        { uri: toUri(functionsPath), range: makeRange(36, 63, 36, 69) },
        { uri: toUri(functionsPath), range: makeRange(37, 31, 37, 37) },
      ])
    )
  })

  // Not implemented: returns no locations; a function named as a value is not linked.
  test.skip('internal function used as a value, from the value', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(36, 63))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(functionsPath), range: makeRange(16, 13, 16, 19) },
        { uri: toUri(functionsPath), range: makeRange(36, 63, 36, 69) },
        { uri: toUri(functionsPath), range: makeRange(37, 31, 37, 37) },
      ])
    )
  })

  // Not implemented: omits the named argument; named arguments are not linked to parameters.
  test.skip('parameter with a named argument, from its declaration', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(12, 45))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 45, 12, 47) },
        { uri: toUri(libPath), range: makeRange(14, 13, 14, 15) },
        { uri: toUri(functionsPath), range: makeRange(49, 28, 49, 30) },
      ])
    )
  })

  // Not implemented: omits the named argument; named arguments are not linked to parameters.
  test.skip('parameter with a named argument, from a use in the body', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(14, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 45, 12, 47) },
        { uri: toUri(libPath), range: makeRange(14, 13, 14, 15) },
        { uri: toUri(functionsPath), range: makeRange(49, 28, 49, 30) },
      ])
    )
  })
})
