import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - import-paths', () => {
  let targetPath: string
  let nestedPath: string

  before(async () => {
    client = await getInitializedClient()
    targetPath = getProjectPath('hardhat3/contracts/definition/import-paths/Target.sol')
    nestedPath = getProjectPath('hardhat3/contracts/definition/import-paths/nested/Nested.sol')

    await client.openDocument(targetPath)
    await client.openDocument(nestedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('import path with ../ goes to the file in the parent directory', async () => {
    const location = await client.findDefinition(toUri(nestedPath), makePosition(3, 13))

    expect(location).to.deep.equal({
      uri: toUri(targetPath),
      range: makeRange(1, 0, 7, 0),
    })
  })

  test('contract imported through a ../ path', async () => {
    const location = await client.findDefinition(toUri(nestedPath), makePosition(6, 6))

    expect(location).to.deep.equal({
      uri: toUri(targetPath),
      range: makeRange(3, 9, 3, 15),
    })
  })
})
