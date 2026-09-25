import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

let client!: TestLanguageClient

// Edits within a file come in no particular order: compare them as sets.
function sorted(edit: WorkspaceEdit | null) {
  if (edit === null) {
    return null
  }
  const changes: Record<string, TextEdit[]> = {}
  for (const [uri, edits] of Object.entries(edit.changes ?? {})) {
    changes[uri] = [...edits].sort(
      (a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character
    )
  }
  return { changes }
}

describe('[hardhat3] rename bug - errors through C.E, events outside emit, and later catch clauses', () => {
  let basePath: string
  let errorsEventsPath: string
  let tryCatchPath: string
  let guardPath: string
  let clientPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/definition/errors-events/Base.sol')
    errorsEventsPath = getProjectPath('hardhat3/contracts/definition/errors-events/ErrorsEvents.sol')
    tryCatchPath = getProjectPath('hardhat3/contracts/definition/errors-events/TryCatch.sol')
    guardPath = getProjectPath('hardhat3/contracts/rename/errors-events/Guard.sol')
    clientPath = getProjectPath('hardhat3/contracts/rename/errors-events/Client.sol')

    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
    await client.openDocument(tryCatchPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(errorsEventsPath)
    await client.openDocument(tryCatchPath)
    await client.openDocument(guardPath)
    await client.openDocument(clientPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: misses the Unauthorized in IEEVault.Unauthorized.selector (34:42-34:54).
  test.skip('inherited interface error from revert, including its use in I.E.selector', async () => {
    const workspaceEdit = await client.rename(toUri(errorsEventsPath), makePosition(29, 41), 'EERNUnauthorized')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(4, 10, 4, 22), newText: 'EERNUnauthorized' }],
          [toUri(errorsEventsPath)]: [
            { range: makeRange(29, 40, 29, 52), newText: 'EERNUnauthorized' },
            { range: makeRange(34, 42, 34, 54), newText: 'EERNUnauthorized' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit.
  test.skip('base error from a qualified revert C.E()', async () => {
    const workspaceEdit = await client.rename(toUri(errorsEventsPath), makePosition(44, 28), 'EERNInsufficient')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(9, 10, 9, 29), newText: 'EERNInsufficient' }],
          [toUri(errorsEventsPath)]: [
            { range: makeRange(23, 48, 23, 67), newText: 'EERNInsufficient' },
            { range: makeRange(44, 27, 44, 46), newText: 'EERNInsufficient' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit.
  test.skip('error from Alias.E.selector through a contract alias', async () => {
    const workspaceEdit = await client.rename(toUri(clientPath), makePosition(23, 21), 'EERNBlocked')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(guardPath)]: [
            { range: makeRange(4, 10, 4, 17), newText: 'EERNBlocked' },
            { range: makeRange(10, 30, 10, 37), newText: 'EERNBlocked' },
          ],
          [toUri(clientPath)]: [
            { range: makeRange(19, 20, 19, 27), newText: 'EERNBlocked' },
            { range: makeRange(23, 20, 23, 27), newText: 'EERNBlocked' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit.
  test.skip('event from E.selector', async () => {
    const workspaceEdit = await client.rename(toUri(errorsEventsPath), makePosition(34, 17), 'EERNPaused')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(errorsEventsPath)]: [
            { range: makeRange(7, 10, 7, 16), newText: 'EERNPaused' },
            { range: makeRange(30, 13, 30, 19), newText: 'EERNPaused' },
            { range: makeRange(34, 16, 34, 22), newText: 'EERNPaused' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit.
  test.skip('parameter of the second catch clause from its use', async () => {
    const workspaceEdit = await client.rename(toUri(tryCatchPath), makePosition(18, 20), 'eerNPanicCode')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(tryCatchPath)]: [
            { range: makeRange(17, 30, 17, 39), newText: 'eerNPanicCode' },
            { range: makeRange(18, 19, 18, 28), newText: 'eerNPanicCode' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit.
  test.skip('catch error parameter after a try success block, from its use', async () => {
    const workspaceEdit = await client.rename(toUri(clientPath), makePosition(10, 20), 'eerNCaught')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(clientPath)]: [
            { range: makeRange(9, 36, 9, 42), newText: 'eerNCaught' },
            { range: makeRange(10, 19, 10, 25), newText: 'eerNCaught' },
          ],
        },
      })
    )
  })
})
