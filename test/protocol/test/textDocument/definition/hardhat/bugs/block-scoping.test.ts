import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - blocks do not open a scope', () => {
  let scopingPath: string

  before(async () => {
    client = await getInitializedClient()
    scopingPath = getProjectPath('hardhat/contracts/definition/variables/Scoping.sol')

    await client.openDocument(scopingPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns null; locals declared in if/else bodies are never linked, because a BlockNode opens no scope.
  test.skip('local declared in an else block', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(13, 19))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(12, 20, 12, 21),
    })
  })

  // Bug: returns null, as for the else block.
  test.skip('local declared in an if block', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(10, 19))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(9, 20, 9, 21),
    })
  })

  // Bug: returns the outer y (18:16-18:17); both y declarations land in the function's scope and the first wins.
  // The committed variables test for nested-block-outer passes only by accident, for the same reason.
  test.skip('local in a nested block that shadows an outer local', async () => {
    const location = await client.findDefinition(toUri(scopingPath), makePosition(22, 16))

    expect(location).to.deep.equal({
      uri: toUri(scopingPath),
      range: makeRange(21, 20, 21, 21),
    })
  })
})
