import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] definition bug - events are resolved only under emit', () => {
  let errorsEventsPath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('hardhat/contracts/definition/errors-events/ErrorsEvents.sol')

    await client.openDocument(errorsEventsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns null. EventDefinitionNode connects only to uses under an EmitStatement.
  test.skip('event in Ev.selector', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(34, 18))

    expect(location).to.deep.equal({
      uri: toUri(errorsEventsPath),
      range: makeRange(7, 10, 7, 16),
    })
  })
})
