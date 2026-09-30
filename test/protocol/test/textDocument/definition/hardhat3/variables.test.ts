import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - variables', () => {
  let modifiersPath: string
  let basePath: string
  let scopingPath: string
  let stateKindsPath: string

  before(async () => {
    client = await getInitializedClient()
    modifiersPath = getProjectPath('hardhat3/contracts/definition/variables/Modifiers.sol')
    basePath = getProjectPath('hardhat3/contracts/definition/variables/ModifierBase.sol')
    scopingPath = getProjectPath('hardhat3/contracts/definition/variables/Scoping.sol')
    stateKindsPath = getProjectPath('hardhat3/contracts/definition/variables/StateKinds.sol')

    await client.openDocument(modifiersPath)
    await client.openDocument(basePath)
    await client.openDocument(scopingPath)
    await client.openDocument(stateKindsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('modifier inherited from a base in another file', async () => {
    const location = await client.findDefinition(toUri(modifiersPath), makePosition(20, 41))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(10, 13, 10, 22),
    })
  })

  test('modifier with arguments declared in the same contract', async () => {
    const location = await client.findDefinition(toUri(modifiersPath), makePosition(20, 51))

    expect(location).to.deep.equal({
      uri: toUri(modifiersPath),
      range: makeRange(15, 13, 15, 20),
    })
  })

  test('modifier inherited from a base in the same file', async () => {
    const location = await client.findDefinition(toUri(modifiersPath), makePosition(20, 66))

    expect(location).to.deep.equal({
      uri: toUri(modifiersPath),
      range: makeRange(6, 13, 6, 19),
    })
  })

  test('modifier parameter used in the modifier body', async () => {
    const location = await client.findDefinition(toUri(modifiersPath), makePosition(16, 16))

    expect(location).to.deep.equal({
      uri: toUri(modifiersPath),
      range: makeRange(15, 29, 15, 35),
    })
  })

  test('outer local after a nested block that shadows it (passes by accident: the first declaration wins)', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(24, 19))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(18, 16, 18, 17),
    })
  })

  test('local variable shadowing a state variable', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(29, 15))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(28, 16, 28, 21),
    })
  })

  test('parameter shadowing a state variable', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(33, 15))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(32, 39, 32, 44),
    })
  })

  test('named return variable assigned in the body', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(37, 8))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(36, 61, 36, 68),
    })
  })

  test('for loop variable used in the loop body', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(42, 19))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(41, 21, 41, 22),
    })
  })

  test('immutable state variable read outside the constructor', async () => {
    const location = await client.findDefinition(toUri(stateKindsPath), makePosition(13, 22))

    expect(location).to.deep.equal({
      uri: toUri(stateKindsPath),
      range: makeRange(5, 29, 5, 37),
    })
  })

  test('constant state variable', async () => {
    const location = await client.findDefinition(toUri(stateKindsPath), makePosition(18, 25))

    expect(location).to.deep.equal({
      uri: toUri(stateKindsPath),
      range: makeRange(4, 28, 4, 33),
    })
  })
})
