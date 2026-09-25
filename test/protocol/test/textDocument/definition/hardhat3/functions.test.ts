import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - functions', () => {
  let functionsPath: string
  let libPath: string

  before(async () => {
    client = await getInitializedClient()
    functionsPath = getProjectPath('hardhat3/contracts/definition/functions/Functions.sol')
    libPath = getProjectPath('hardhat3/contracts/definition/functions/FunctionsLib.sol')

    await client.openDocument(functionsPath)
    await client.openDocument(libPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('overloaded call goes to the overload declared first', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(30, 22))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(8, 13, 8, 16),
    })
  })

  test('parameter used in the body', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(9, 14))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(8, 25, 8, 26),
    })
  })

  test('named return variable used in the body', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(9, 8))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(8, 68, 8, 71),
    })
  })

  test('function-type parameter called in the body', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(25, 15))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(24, 71, 24, 73),
    })
  })

  test('library function called through the library name', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(41, 25))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(4, 13, 4, 18),
    })
  })

  test('public getter called externally goes to the state variable', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(45, 32))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(10, 19, 10, 24),
    })
  })

  test('external call with call options', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(46, 14))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 13, 12, 20),
    })
  })

  test('external function assigned to a function-type variable', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(47, 79))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 13, 12, 20),
    })
  })

  test('overloaded call through this goes to the overload with the right arity', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(53, 20))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(8, 13, 8, 16),
    })
  })

  test('function in this.f.selector', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(58, 17))

    expect(location).to.deep.equal({
      uri: toUri(functionsPath),
      range: makeRange(20, 13, 20, 17),
    })
  })

  test('function in C.f.selector, from another file', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(59, 20))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 13, 12, 20),
    })
  })

  test('function in abi.encodeCall', async () => {
    const location = await client.findDefinition(toUri(functionsPath), makePosition(61, 35))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 13, 12, 20),
    })
  })
})
