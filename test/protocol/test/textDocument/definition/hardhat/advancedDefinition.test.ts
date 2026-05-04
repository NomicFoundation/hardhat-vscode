import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] advancedDefinition', () => {
  let advancedDocPath: string

  before(async () => {
    client = await getInitializedClient()

    advancedDocPath = getProjectPath('hardhat/contracts/definition/Advanced.sol')

    await client.openDocument(advancedDocPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('[inheritance] go to definition on leftOnly() call resolves to DiamondLeft', async () => {
    // Line 35 (0-indexed): "        return leftOnly();"
    // "leftOnly" starts at character 15
    const location = await client.findDefinition(toUri(advancedDocPath), makePosition(35, 15))

    expect(location).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(10, 13, 10, 21),
    })
  })

  test('[inheritance] go to definition on DiamondBase in inheritance clause', async () => {
    // Line 9 (0-indexed): "contract DiamondLeft is DiamondBase {"
    // "DiamondBase" starts at character 24
    const location = await client.findDefinition(toUri(advancedDocPath), makePosition(9, 24))

    expect(location).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(3, 9, 3, 20),
    })
  })

  test('[overload] go to definition on calculate(5) call returns all overloads', async () => {
    // Line 47 (0-indexed): "        uint256 a = calculate(5);"
    // "calculate" starts at character 20
    const location = await client.findDefinition(toUri(advancedDocPath), makePosition(47, 20))

    // BindingGraph returns all overloads (no type-based disambiguation)
    expect(location).to.be.an('array').with.lengthOf(2)
    const locations = location as any[]
    expect(locations[0]).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(38, 13, 38, 22),
    })
    expect(locations[1]).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(42, 13, 42, 22),
    })
  })

  test('[overload] go to definition on calculate(2, 3) call returns all overloads', async () => {
    // Line 48 (0-indexed): "        uint256 b = calculate(2, 3);"
    // "calculate" starts at character 20
    const location = await client.findDefinition(toUri(advancedDocPath), makePosition(48, 20))

    // BindingGraph returns all overloads (no type-based disambiguation)
    expect(location).to.be.an('array').with.lengthOf(2)
    const locations = location as any[]
    expect(locations[0]).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(38, 13, 38, 22),
    })
    expect(locations[1]).to.deep.equal({
      uri: toUri(advancedDocPath),
      range: makeRange(42, 13, 42, 22),
    })
  })

  test('[diamond] go to definition on shared() override in Diamond', async () => {
    // Line 30 (0-indexed): "    function shared() public pure override(DiamondLeft, DiamondRight) ..."
    // "shared" starts at character 13
    const location = await client.findDefinition(toUri(advancedDocPath), makePosition(30, 13))

    // When on the definition itself, returns the definition location
    expect(location).to.have.property('uri', toUri(advancedDocPath))
  })
})
