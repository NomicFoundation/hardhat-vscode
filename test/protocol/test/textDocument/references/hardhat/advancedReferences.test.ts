/* eslint-disable @typescript-eslint/no-unused-expressions */
import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] advancedReferences', () => {
  let advancedDocPath: string

  before(async () => {
    client = await getInitializedClient()

    advancedDocPath = getProjectPath('hardhat/contracts/definition/Advanced.sol')

    await client.openDocument(advancedDocPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('[inheritance] find references on leftOnly includes definition and call', async () => {
    // Line 10 (0-indexed): "    function leftOnly() public pure returns (uint256) {"
    // "leftOnly" starts at character 13
    const locations = await client.findReferences(toUri(advancedDocPath), makePosition(10, 13))

    expect(locations).to.not.be.null
    expect(locations).to.be.an('array')
    expect(locations!.length).to.be.at.least(2)

    // Should include the definition (line 10, char 13)
    const definitionLoc = locations!.find((loc) => loc.range.start.line === 10 && loc.range.start.character === 13)
    expect(definitionLoc).to.not.be.undefined

    // Should include the call in callLeftOnly (line 35, char 15)
    const callLoc = locations!.find((loc) => loc.range.start.line === 35 && loc.range.start.character === 15)
    expect(callLoc).to.not.be.undefined
  })

  test('[diamond] find references on shared in DiamondBase includes overrides', async () => {
    // Line 4 (0-indexed): "    function shared() public pure virtual returns (uint256) {"
    // "shared" starts at character 13
    const locations = await client.findReferences(toUri(advancedDocPath), makePosition(4, 13))

    expect(locations).to.not.be.null
    expect(locations).to.be.an('array')
    // At minimum: DiamondBase.shared definition
    expect(locations!.length).to.be.at.least(1)

    // Should include the DiamondBase definition (line 4, char 13)
    const baseLoc = locations!.find((loc) => loc.range.start.line === 4 && loc.range.start.character === 13)
    expect(baseLoc).to.not.be.undefined
  })
})
