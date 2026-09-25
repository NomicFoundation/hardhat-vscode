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

describe('[hardhat] references - import-paths', () => {
  let basePath: string
  let nestedPath: string
  let deepPath: string
  let ownableUserPath: string
  let consoleUserPath: string
  let ozPath: string
  let contextPath: string
  let consolePath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat/contracts/references/import-paths/IpBase.sol')
    nestedPath = getProjectPath('hardhat/contracts/references/import-paths/nested/IpNested.sol')
    deepPath = getProjectPath('hardhat/contracts/references/import-paths/deep/inner/IpDeep.sol')
    ownableUserPath = getProjectPath('hardhat/contracts/references/import-paths/IpOwnable.sol')
    consoleUserPath = getProjectPath('hardhat/contracts/references/import-paths/IpConsole.sol')
    ozPath = getProjectPath('hardhat/node_modules/@openzeppelin/contracts/access/Ownable.sol')
    contextPath = getProjectPath('hardhat/node_modules/@openzeppelin/contracts/utils/Context.sol')
    consolePath = getProjectPath('hardhat/node_modules/hardhat/console.sol')

    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
    await client.openDocument(ownableUserPath)
    await client.openDocument(consoleUserPath)
    await client.openDocument(ozPath)
    await client.openDocument(contextPath)
    await client.openDocument(consolePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract in a parent directory, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(3, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })

  test('contract in a parent directory, from its name in a ../ import', async () => {
    const locations = await client.findReferences(toUri(nestedPath), makePosition(3, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })

  test('contract in a parent directory, from a use two directories down', async () => {
    const locations = await client.findReferences(toUri(deepPath), makePosition(9, 20))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })

  test('package function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(ozPath), makePosition(70, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ozPath), range: makeRange(70, 13, 70, 31) },
        { uri: toUri(ozPath), range: makeRange(28, 8, 28, 26) },
        { uri: toUri(ozPath), range: makeRange(54, 8, 54, 26) },
        { uri: toUri(ozPath), range: makeRange(63, 8, 63, 26) },
        { uri: toUri(ownableUserPath), range: makeRange(7, 8, 7, 26) },
        { uri: toUri(ownableUserPath), range: makeRange(12, 8, 12, 26) },
      ])
    )
  })

  test('package function, from a use in an inheriting contract', async () => {
    const locations = await client.findReferences(toUri(ownableUserPath), makePosition(7, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(ozPath), range: makeRange(70, 13, 70, 31) },
        { uri: toUri(ozPath), range: makeRange(28, 8, 28, 26) },
        { uri: toUri(ozPath), range: makeRange(54, 8, 54, 26) },
        { uri: toUri(ozPath), range: makeRange(63, 8, 63, 26) },
        { uri: toUri(ownableUserPath), range: makeRange(7, 8, 7, 26) },
        { uri: toUri(ownableUserPath), range: makeRange(12, 8, 12, 26) },
      ])
    )
  })

  test('function of a transitively imported package base, from its declaration', async () => {
    const locations = await client.findReferences(toUri(contextPath), makePosition(20, 13))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(contextPath), range: makeRange(20, 13, 20, 21) },
        { uri: toUri(ownableUserPath), range: makeRange(16, 15, 16, 23) },
      ])
    )
  })

  test('function of a transitively imported package base, from a use', async () => {
    const locations = await client.findReferences(toUri(ownableUserPath), makePosition(16, 15))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(contextPath), range: makeRange(20, 13, 20, 21) },
        { uri: toUri(ownableUserPath), range: makeRange(16, 15, 16, 23) },
      ])
    )
  })

  test('console library function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(consolePath), makePosition(67, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(consolePath), range: makeRange(67, 10, 67, 19) },
        { uri: toUri(consoleUserPath), range: makeRange(7, 16, 7, 25) },
      ])
    )
  })

  test('console library function, from a use', async () => {
    const locations = await client.findReferences(toUri(consoleUserPath), makePosition(7, 16))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(consolePath), range: makeRange(67, 10, 67, 19) },
        { uri: toUri(consoleUserPath), range: makeRange(7, 16, 7, 25) },
      ])
    )
  })
})
