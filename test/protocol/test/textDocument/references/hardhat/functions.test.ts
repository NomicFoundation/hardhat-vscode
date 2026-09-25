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

describe('[hardhat] references - functions', () => {
  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('hardhat/contracts/definition/functions/Functions.sol')
    libPath = getProjectPath('hardhat/contracts/definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('external function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(12, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 13, 12, 20) },
        { uri: toUri(functionsPath), range: makeRange(46, 14, 46, 21) },
        { uri: toUri(functionsPath), range: makeRange(47, 79, 47, 86) },
        { uri: toUri(functionsPath), range: makeRange(49, 19, 49, 26) },
        { uri: toUri(functionsPath), range: makeRange(59, 20, 59, 27) },
        { uri: toUri(functionsPath), range: makeRange(61, 43, 61, 50) },
      ])
    )
  })

  test('external function, from a call with call options', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(46, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 13, 12, 20) },
        { uri: toUri(functionsPath), range: makeRange(46, 14, 46, 21) },
        { uri: toUri(functionsPath), range: makeRange(47, 79, 47, 86) },
        { uri: toUri(functionsPath), range: makeRange(49, 19, 49, 26) },
        { uri: toUri(functionsPath), range: makeRange(59, 20, 59, 27) },
        { uri: toUri(functionsPath), range: makeRange(61, 43, 61, 50) },
      ])
    )
  })

  test('public getter, from the state variable', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(10, 19))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(10, 19, 10, 24) },
        { uri: toUri(libPath), range: makeRange(13, 8, 13, 13) },
        { uri: toUri(functionsPath), range: makeRange(45, 32, 45, 37) },
        { uri: toUri(functionsPath), range: makeRange(60, 18, 60, 23) },
      ])
    )
  })

  test('public getter, from an external getter call', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(45, 32))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(10, 19, 10, 24) },
        { uri: toUri(libPath), range: makeRange(13, 8, 13, 13) },
        { uri: toUri(functionsPath), range: makeRange(45, 32, 45, 37) },
        { uri: toUri(functionsPath), range: makeRange(60, 18, 60, 23) },
      ])
    )
  })

  test('library function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(4, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(4, 13, 4, 18) },
        { uri: toUri(functionsPath), range: makeRange(41, 25, 41, 30) },
      ])
    )
  })

  test('library function, from a call through the library name', async () => {
    const locations = await client.findReferences(toUri(functionsPath), makePosition(41, 25))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(4, 13, 4, 18) },
        { uri: toUri(functionsPath), range: makeRange(41, 25, 41, 30) },
      ])
    )
  })
})
