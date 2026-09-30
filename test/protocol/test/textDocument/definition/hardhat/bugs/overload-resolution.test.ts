import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - overload resolution', () => {
  let functionsPath: string
  let sameArityPath: string
  let callerPath: string
  let consolePath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('hardhat/contracts/definition/functions/Functions.sol')
    sameArityPath = getProjectPath('hardhat/contracts/definition/bugs/overload-resolution/SameArity.sol')
    callerPath = getProjectPath('hardhat/contracts/definition/bugs/overload-resolution/ConsoleCaller.sol')
    consolePath = getProjectPath('hardhat/contracts/definition/../../node_modules/hardhat/console.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(sameArityPath)
    await client.openDocument(callerPath)
    await client.openDocument(consolePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns the two-parameter add declared first (8:13-8:16); overloads are matched on argument count only, and this plain call takes the first by name.
  test.skip('call to the one-parameter overload declared second', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(29, 22))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(12, 13, 12, 16),
    })
  })

  // Bug: returns log(uint256) declared first (4:13-4:16); same-arity overloads are not told apart by argument type.
  test.skip('library call to the same-arity overload taking a string', async () => {
    const location = await client.findDefinition(toUri(sameArityPath), makePosition(15, 21))

    expect(location).to.deep.equal({
      uri: toUri(sameArityPath),
      range: makeRange(8, 13, 8, 16),
    })
  })

  // Bug: returns log(uint p0) (171:10-171:13), the first one-argument log.
  test.skip('console.log with a string goes to log(string)', async () => {
    const location = await client.findDefinition(toUri(callerPath), makePosition(10, 16))

    expect(location).to.deep.equal({
      uri: toUri(consolePath),
      range: makeRange(175, 10, 175, 13),
    })
  })

  // Bug: returns log(uint p0, uint p1) (187:10-187:13), the first two-argument log.
  test.skip('console.log with a string and a uint goes to log(string, uint)', async () => {
    const location = await client.findDefinition(toUri(callerPath), makePosition(11, 16))

    expect(location).to.deep.equal({
      uri: toUri(consolePath),
      range: makeRange(203, 10, 203, 13),
    })
  })
})
