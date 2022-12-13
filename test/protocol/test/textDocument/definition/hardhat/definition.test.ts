import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange, sleep } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition', () => {
  let testDocPath: string
  let importDocPath: string
  let circular1DocPath: string
  let circular2DocPath: string

  before(async () => {
    client = await getInitializedClient()

    testDocPath = getProjectPath('hardhat/contracts/definition/Test.sol')
    importDocPath = getProjectPath('hardhat/contracts/definition/ImportTest.sol')
    circular1DocPath = getProjectPath('hardhat/contracts/definition/Circular1.sol')
    circular2DocPath = getProjectPath('hardhat/contracts/definition/Circular2.sol')

    await client.openDocument(testDocPath)
    await client.openDocument(importDocPath)
    await client.openDocument(circular1DocPath)
    await client.openDocument(circular2DocPath)
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('[single-file] - go to definition', async () => {
    const location = await client.findDefinition(toUri(testDocPath), makePosition(14, 25))

    expect(location).to.deep.equal({
      uri: toUri(testDocPath),
      range: makeRange(9, 11, 9, 16),
    })
  })

  test('[Single-file][Defined after usage] - Go to Definition', async () => {
    const location = await client.findDefinition(toUri(testDocPath), makePosition(15, 9))

    expect(location).to.deep.equal({
      uri: toUri(testDocPath),
      range: makeRange(53, 11, 53, 19),
    })
  })

  test('[Single-file][MemberAccess] - Go to Definition', async () => {
    const location = await client.findDefinition(toUri(testDocPath), makePosition(26, 25))

    expect(location).to.deep.equal({
      uri: toUri(testDocPath),
      range: makeRange(10, 13, 10, 18),
    })
  })

  test('[Single-file][MemberAccess][Defined after usage] - Go to Definition', async () => {
    const location = await client.findDefinition(toUri(testDocPath), makePosition(50, 50))

    expect(location).to.deep.equal({
      uri: toUri(testDocPath),
      range: makeRange(54, 16, 54, 20),
    })
  })

  test('[Single-file][MemberAccess][Defined after usage] - Go to Definition', async () => {
    const location = await client.findDefinition(toUri(testDocPath), makePosition(50, 50))

    expect(location).to.deep.equal({
      uri: toUri(testDocPath),
      range: makeRange(54, 16, 54, 20),
    })
  })

  test('[Multi-file] Jump to import file', async () => {
    const location = await client.findDefinition(toUri(importDocPath), makePosition(3, 25))

    expect(location).to.deep.equal({
      uri: toUri(getProjectPath('hardhat/contracts/definition/Foo.sol')),
      range: makeRange(1, 0, 6, 0),
    })
  })

  test('[Multi-file] Jump to library file', async () => {
    const location = await client.findDefinition(toUri(importDocPath), makePosition(4, 73))

    expect(location).to.deep.equal({
      uri: toUri(getProjectPath('hardhat/node_modules/@openzeppelin/contracts/access/Ownable.sol')),
      range: makeRange(3, 0, 76, 0),
    })
  })

  test('[Multi-file] Circular dependency navigation', async () => {
    const location = await client.findDefinition(toUri(circular1DocPath), makePosition(6, 6))

    expect(location).to.deep.equal({
      uri: toUri(circular2DocPath),
      range: makeRange(5, 9, 5, 18),
    })
  })

  test('[Multi-file] Circular dependency navigation 2', async () => {
    const location = await client.findDefinition(toUri(circular2DocPath), makePosition(6, 6))

    expect(location).to.deep.equal({
      uri: toUri(circular1DocPath),
      range: makeRange(5, 9, 5, 18),
    })
  })
})
