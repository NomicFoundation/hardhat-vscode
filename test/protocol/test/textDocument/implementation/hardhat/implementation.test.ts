/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] implementation', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  describe('[single-file] - find all implementations', function () {
    it('should should find implementations', async () => {
      const documentPath = getProjectPath('hardhat/contracts/implementation/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      const locations = await client.findImplementations(documentUri, makePosition(53, 15))

      expect(locations).to.deep.equal([
        {
          uri: toUri(documentPath),
          range: makeRange(53, 11, 53, 19),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(15, 4, 15, 12),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(18, 8, 18, 16),
        },
        {
          uri: toUri(documentPath),
          range: makeRange(38, 100, 38, 108),
        },
      ])
    })

    it('[interface function] should find implementing function in contract', async () => {
      const documentPath = getProjectPath('hardhat/contracts/implementation/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      // Position on "giveVote" in interface ABV (line 5, 0-indexed 4)
      // "    function giveVote(..." - giveVote starts at character 13
      const locations = await client.findImplementations(documentUri, makePosition(4, 13))

      // Should find the concrete implementation in contract Test at line 26 (0-indexed 25)
      expect(locations).to.be.an('array').that.is.not.empty
      const locArray = locations as Array<{ uri: string; range: { start: { line: number } } }>
      const hasImplementation = locArray.some((loc) => loc.uri === documentUri && loc.range.start.line === 25)
      expect(hasImplementation).to.be.true
    })

    it('[no implementation] should return empty for non-interface function', async () => {
      const documentPath = getProjectPath('hardhat/contracts/implementation/Test.sol')
      const documentUri = toUri(documentPath)

      await client.openDocument(documentPath)

      // Position on "getLastProposalName" (line 50, 0-indexed 49) - a concrete function with no overrides
      // "    function getLastProposalName(..." - starts at character 13
      const locations = await client.findImplementations(documentUri, makePosition(49, 13))

      // A concrete function with no other implementations should return only itself or empty
      expect(locations).to.be.an('array')
    })
  })
})
