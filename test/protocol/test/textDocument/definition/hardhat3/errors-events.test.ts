import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] definition - errors-events', () => {
  let errorsEventsPath: string
  let basePath: string
  let tryCatchPath: string

  before(async () => {
    client = await getInitializedClient()
    errorsEventsPath = getProjectPath('hardhat3/contracts/definition/errors-events/ErrorsEvents.sol')
    basePath = getProjectPath('hardhat3/contracts/definition/errors-events/Base.sol')
    tryCatchPath = getProjectPath('hardhat3/contracts/definition/errors-events/TryCatch.sol')

    await client.openDocument(errorsEventsPath)
    await client.openDocument(basePath)
    await client.openDocument(tryCatchPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('error in revert, declared in the same contract', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(17, 37))

    expect(location).to.deep.equal({
      uri: toUri(errorsEventsPath),
      range: makeRange(6, 10, 6, 20),
    })
  })

  test('error in revert, inherited from an interface', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(29, 42))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(4, 10, 4, 22),
    })
  })

  test('error in require(bool, error), inherited from a base contract', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(23, 50))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(9, 10, 9, 29),
    })
  })

  test('event in emit, declared in the same contract', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(30, 15))

    expect(location).to.deep.equal({
      uri: toUri(errorsEventsPath),
      range: makeRange(7, 10, 7, 16),
    })
  })

  test('event in emit, inherited from an interface', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(19, 15))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(5, 10, 5, 19),
    })
  })

  test('event in emit, inherited from a base contract', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(25, 15))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(10, 10, 10, 19),
    })
  })

  test('event in emit I.Ev, from a contract that does not inherit I', async () => {
    const location = await client.findDefinition(toUri(errorsEventsPath), makePosition(40, 24))

    expect(location).to.deep.equal({
      uri: toUri(basePath),
      range: makeRange(5, 10, 5, 19),
    })
  })

  test('function called in a try expression', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(13, 21))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(4, 13, 4, 18),
    })
  })

  test('try returns variable used in the success block', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(14, 18))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(13, 44, 13, 45),
    })
  })

  test('catch Error parameter used in its block', async () => {
    const location = await client.findDefinition(toUri(tryCatchPath), makePosition(16, 20))

    expect(location).to.deep.equal({
      uri: toUri(tryCatchPath),
      range: makeRange(15, 36, 15, 42),
    })
  })
})
