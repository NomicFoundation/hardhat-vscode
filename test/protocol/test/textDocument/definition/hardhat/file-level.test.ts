import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - file-level', () => {
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('free function called from a contract in the same file', async () => {
    const location = await client.findDefinition(toUri(defsPath), makePosition(46, 17))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(19, 9, 19, 14),
    })
  })

  test('free function called from another free function', async () => {
    const location = await client.findDefinition(toUri(defsPath), makePosition(24, 13))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(19, 9, 19, 14),
    })
  })

  test('file-level constant in the same file', async () => {
    const location = await client.findDefinition(toUri(defsPath), makePosition(45, 18))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(3, 17, 3, 26),
    })
  })

  test('free function from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(13, 35))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(19, 9, 19, 14),
    })
  })

  test('file-level constant from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(12, 18))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(3, 17, 3, 26),
    })
  })

  test('file-level struct as a parameter type, from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(11, 20))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(5, 7, 5, 12),
    })
  })

  test('file-level enum as a state variable type, from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(9, 6))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(10, 5, 10, 10),
    })
  })

  test('file-level custom error in revert, from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(12, 36))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(15, 6, 15, 13),
    })
  })
})
