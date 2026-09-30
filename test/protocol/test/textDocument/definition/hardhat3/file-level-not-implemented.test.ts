import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - file-level (not implemented)', () => {
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('hardhat3/contracts/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('hardhat3/contracts/definition/file-level/FileLevelUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('attached call through a file-level using brace list, same file', async () => {
    const location = await client.findDefinition(toUri(defsPath), makePosition(50, 18))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(31, 9, 31, 12),
    })
  })

  // Not implemented: returns null.
  test.skip('attached call through a file-level using brace list, from another file', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(13, 29))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(27, 9, 27, 14),
    })
  })

  // Not implemented: returns null.
  test.skip('attached call through a file-level using library directive', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(15, 29))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(36, 13, 36, 22),
    })
  })

  // Not implemented: returns null.
  test.skip('free function named in a file-level using brace list', async () => {
    const location = await client.findDefinition(toUri(userPath), makePosition(5, 9))

    expect(location).to.deep.equal({
      uri: toUri(defsPath),
      range: makeRange(27, 9, 27, 14),
    })
  })
})
