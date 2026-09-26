import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - inheritance', () => {
  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('hardhat3/contracts/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract in an inheritance list, from another file', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(5, 20))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(11, 18, 11, 22),
    })
  })

  test('contract in an inheritance list, from the same file', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(17, 18))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(5, 9, 5, 15),
    })
  })

  test('interface inheriting an interface', async () => {
    const location = await client.findDefinition(toUri(basePath), makePosition(7, 24))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(3, 10, 3, 15),
    })
  })

  test('base constructor call in a constructor goes to the base constructor', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(6, 19))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(14, 4, 14, 15),
    })
  })

  test('base constructor arguments in an inheritance list go to the base contract', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(27, 19))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(11, 18, 11, 22),
    })
  })

  test('super call goes to the next function in the linearization', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(9, 22))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(18, 13, 18, 18),
    })
  })

  test('super call from a grandchild goes to the middle override', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(19, 37))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(8, 13, 8, 18),
    })
  })

  test('qualified base call skips the override in between', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(19, 21))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(18, 13, 18, 18),
    })
  })

  test('qualifier of a base call', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(19, 16))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(11, 18, 11, 22),
    })
  })

  test('state variable inherited two levels up', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(23, 9))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(12, 21, 12, 27),
    })
  })

  test('inherited function called unqualified', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(29, 18))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(18, 13, 18, 18),
    })
  })

  test('new contract goes to its constructor', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(35, 28))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(6, 4, 6, 15),
    })
  })

  test('new contract with call options and no constructor goes to the contract', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(36, 27))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(17, 9, 17, 13),
    })
  })

  test('contract in type(C).name', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(41, 22))

    expect(location).to.deep.equal({
      uri: toUri(derivedPath),
      range: makeRange(17, 9, 17, 13),
    })
  })

  test('interface in type(I).interfaceId', async () => {
    const location = await client.findDefinition(toUri(derivedPath), makePosition(41, 39))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(7, 10, 7, 19),
    })
  })
})
