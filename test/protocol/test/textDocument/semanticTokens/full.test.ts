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
        2, 0, 6, 0, 0, 0, 7, 8, 0, 0, 2, 0, 9, 0, 0, 0, 10, 13, 2, 0, 2, 0, 6, 0, 0, 0, 7, 10, 2, 0, 1, 4, 7, 0, 0, 1,
        4, 6, 0, 0, 1, 4, 7, 0, 0, 3, 0, 8, 0, 0, 0, 9, 12, 2, 0, 1, 4, 5, 0, 0, 0, 6, 9, 2, 0, 1, 8, 12, 2, 0, 0, 35,
        13, 2, 0, 0, 37, 10, 2, 0, 3, 4, 12, 2, 0, 2, 4, 13, 2, 0, 2, 4, 10, 2, 0, 2, 4, 7, 0, 0, 0, 18, 4, 1, 0, 0, 7,
        3, 1, 0, 2, 4, 6, 0, 0, 0, 17, 6, 3, 0, 2, 4, 8, 0, 0, 0, 9, 12, 4, 0, 1, 8, 12, 2, 0, 1, 8, 13, 2, 0, 1, 8, 10,
        2, 0, 0, 11, 6, 0, 0, 1, 6, 6, 0, 0, 1, 8, 12, 2, 0, 2, 8, 13, 2, 0, 1, 8, 10, 2, 0, 0, 11, 6, 0, 0, 8, 8, 4, 0,
        0, 0, 5, 9, 2, 0, 4, 8, 10, 2, 0, 0, 11, 6, 0, 0, 2, 8, 15, 4, 0, 3, 4, 8, 0, 0, 0, 9, 15, 4, 0, 0, 18, 6, 0, 0,
        0, 7, 4, 0, 0,
      ],
    })
  })
})
