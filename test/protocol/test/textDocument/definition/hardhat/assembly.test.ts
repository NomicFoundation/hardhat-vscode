import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition - assembly', () => {
  let assemblyPath: string

  before(async () => {
    client = await getInitializedClient()
    assemblyPath = getProjectPath('hardhat/contracts/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(assemblyPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('solidity parameter used in assembly', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(12, 31))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(9, 28, 9, 34),
    })
  })

  test('constant used in assembly', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(13, 46))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(4, 29, 4, 34),
    })
  })

  test('named return variable assigned in assembly', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(13, 12))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(9, 67, 9, 73),
    })
  })

  test('yul let variable', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(13, 26))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(12, 16, 12, 23),
    })
  })

  test('yul function called before its definition', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(33, 23))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(34, 21, 34, 27),
    })
  })

  test('yul for-loop init variable used in the condition', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(38, 34))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(38, 22, 38, 23),
    })
  })

  test('outer yul variable used in a nested block', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(42, 20))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(33, 16, 33, 19),
    })
  })

  test('leave has no definition', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(35, 31))

    expect(location).to.equal(null)
  })
})
