import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - errors are not resolved through a qualifier', () => {
  let errorsEventsPath: string
  let basePath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('hardhat/contracts/definition/errors-events/ErrorsEvents.sol')
    basePath = getProjectPath('hardhat/contracts/definition/errors-events/Base.sol')

    await client.openDocument(errorsEventsPath)
    await client.openDocument(basePath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns null. The qualifier resolves, but CustomErrorDefinitionNode does not connect to a MemberAccess.
  test.skip('error in revert C.E, from a contract that does not inherit C', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(44, 29))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(9, 10, 9, 29),
    })
  })

  // Bug: returns null. The qualifier resolves, but CustomErrorDefinitionNode does not connect to a MemberAccess.
  test.skip('error in I.E.selector', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(34, 44))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(4, 10, 4, 22),
    })
  })
})
