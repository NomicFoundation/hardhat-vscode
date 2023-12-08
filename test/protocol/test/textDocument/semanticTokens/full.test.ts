import { expect } from 'chai'
import { test } from 'mocha'
import { TestLanguageClient } from '../../../src/TestLanguageClient'
import { getInitializedClient } from '../../client'
import { getProjectPath } from '../../helpers'
import { toUri } from '../../../src/helpers'

let client!: TestLanguageClient

describe('[hardhat] semanticTokens/full', () => {
  let testPath: string

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('hardhat/contracts/semanticTokens/full/SemanticTokens.sol')

    await client.openDocument(testPath)
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('provides highlighting for types, keywords, functions, numbers and strings', async function () {
    const semanticTokens = await client.getSemanticTokensFull(toUri(testPath))

    expect(semanticTokens).to.deep.equal({
      data: [
        4, 5, 10, 2, 0, 2, 10, 13, 2, 0, 2, 7, 10, 2, 0, 6, 5, 8, 2, 0, 6, 6, 11, 2, 0, 2, 8, 9, 2, 0, 2, 9, 12, 2, 0,
        1, 10, 9, 2, 0, 1, 8, 12, 2, 0, 0, 35, 13, 2, 0, 0, 37, 10, 2, 0, 3, 4, 12, 2, 0, 2, 4, 13, 2, 0, 2, 4, 10, 2,
        0, 6, 13, 12, 4, 0, 1, 8, 12, 2, 0, 1, 8, 13, 2, 0, 1, 8, 10, 2, 0, 2, 8, 12, 2, 0, 2, 8, 13, 2, 0, 1, 8, 10, 2,
        0, 8, 13, 9, 2, 0, 4, 8, 10, 2, 0, 2, 8, 15, 4, 0, 3, 13, 15, 4, 0,
      ],
    })
  })
})
