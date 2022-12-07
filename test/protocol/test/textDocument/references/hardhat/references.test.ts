import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] references', () => {
  let testPath: string
  let importedPath: string
  let modifierInvocationPath: string
  let fooPath: string

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  after(async () => {
    client.closeAllDocuments()
  })

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('hardhat/contracts/references/Test.sol')
    importedPath = getProjectPath('hardhat/contracts/references/Imported.sol')
    modifierInvocationPath = getProjectPath('hardhat/contracts/references/ModifierInvocation.sol')
    fooPath = getProjectPath('hardhat/contracts/references/Foo.sol')

    await client.openDocument(testPath)
    await client.openDocument(importedPath)
    await client.openDocument(modifierInvocationPath)
    await client.openDocument(fooPath)
  })

  test('[single-file] - find all references', async function () {
    const locations = await client.findReferences(toUri(testPath), makePosition(9, 14))

    expect(locations).to.deep.equal([
      {
        uri: testPath,
        range: makeRange(9, 11, 9, 16),
      },
      {
        uri: testPath,
        range: makeRange(14, 23, 14, 28),
      },
      {
        uri: testPath,
        range: makeRange(38, 119, 38, 124),
      },
      {
        uri: testPath,
        range: makeRange(43, 12, 43, 17),
      },
    ])
  })

  test('[Single-file] - Find All References for InsufficientBalance', async function () {
    const locations = await client.findReferences(toUri(importedPath), makePosition(11, 15))

    expect(locations).to.deep.equal([
      {
        uri: importedPath,
        range: makeRange(11, 6, 11, 25),
      },
      {
        uri: getProjectPath('hardhat/contracts/references/ImportTest.sol'),
        range: makeRange(12, 19, 12, 38),
      },
      {
        uri: importedPath,
        range: makeRange(20, 19, 20, 38),
      },
    ])
  })

  test('[Single-file] - Find All References for InsufficientBalance balance parameter', async function () {
    const locations = await client.findReferences(toUri(importedPath), makePosition(11, 38))

    expect(locations).to.deep.equal([
      {
        uri: importedPath,
        range: makeRange(11, 34, 11, 41),
      },
      {
        uri: getProjectPath('hardhat/contracts/references/ImportTest.sol'),
        range: makeRange(13, 16, 13, 23),
      },
      {
        uri: importedPath,
        range: makeRange(21, 16, 21, 23),
      },
    ])
  })

  test('[Single-file] - Find All References for AbstractVault', async function () {
    const locations = await client.findReferences(toUri(modifierInvocationPath), makePosition(16, 26))

    expect(locations).to.deep.equal([
      {
        uri: modifierInvocationPath,
        range: makeRange(5, 4, 5, 15),
      },
      {
        uri: modifierInvocationPath,
        range: makeRange(16, 19, 16, 32),
      },
    ])
  })

  test('[Single-file] - Find All References for `fee` modifier', async function () {
    const locations = await client.findReferences(toUri(modifierInvocationPath), makePosition(24, 55))

    expect(locations).to.deep.equal([
      {
        uri: modifierInvocationPath,
        range: makeRange(9, 13, 9, 16),
      },
      {
        uri: modifierInvocationPath,
        range: makeRange(24, 53, 24, 56),
      },
    ])
  })

  test('[Single-file] - Find All References for `fee1` modifier', async function () {
    const locations = await client.findReferences(toUri(modifierInvocationPath), makePosition(24, 72))

    expect(locations).to.deep.equal([
      {
        uri: modifierInvocationPath,
        range: makeRange(20, 13, 20, 17),
      },
      {
        uri: modifierInvocationPath,
        range: makeRange(24, 70, 24, 74),
      },
    ])
  })

  test('[Single-file] - Find All References for `fee2` modifier', async function () {
    const locations = await client.findReferences(toUri(modifierInvocationPath), makePosition(24, 90))

    expect(locations).to.deep.equal([
      {
        uri: modifierInvocationPath,
        range: makeRange(28, 13, 28, 17),
      },
      {
        uri: modifierInvocationPath,
        range: makeRange(24, 88, 24, 92),
      },
    ])
  })

  test('[Multi-file] - Find All References', async function () {
    const locations = await client.findReferences(toUri(fooPath), makePosition(6, 20))

    expect(locations).to.deep.equal([
      {
        uri: fooPath,
        range: makeRange(6, 18, 6, 22),
      },
      {
        uri: getProjectPath('hardhat/contracts/references/MultiImport.sol'),
        range: makeRange(13, 19, 13, 23),
      },
      {
        uri: getProjectPath('hardhat/contracts/references/MultiImport.sol'),
        range: makeRange(17, 40, 17, 44),
      },
    ])
  })
})
