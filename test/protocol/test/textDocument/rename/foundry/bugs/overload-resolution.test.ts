import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
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

describe('[foundry] rename bug - overloads matched by argument count or by name', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let libPath: string
  let functionsPath: string
  let refsPath: string
  let logPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('foundry/src/definition/functions/FunctionsLib.sol')
    functionsPath = getProjectPath('foundry/src/definition/functions/Functions.sol')
    refsPath = getProjectPath('foundry/src/references/bugs/overload-resolution/FunctionRefs.sol')
    logPath = getProjectPath('foundry/src/references/errors-events/Log.sol')
    userPath = getProjectPath('foundry/src/references/errors-events/User.sol')

    await client.openDocument(libPath)
    await client.openDocument(functionsPath)
    await client.openDocument(refsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(libPath)
    await client.openDocument(functionsPath)
    await client.openDocument(refsPath)
    await client.openDocument(logPath)
    await client.openDocument(userPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: also renames add(1) (29:22), which calls the one-parameter overload.
  test.skip('two-parameter overload, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(30, 22), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(functionsPath)]: [
            { range: makeRange(8, 13, 8, 16), newText: 'renamedFn' },
            { range: makeRange(30, 22, 30, 25), newText: 'renamedFn' },
            { range: makeRange(31, 24, 31, 27), newText: 'renamedFn' },
            { range: makeRange(53, 20, 53, 23), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Bug: renames the two-parameter add and its calls (8:13, 29:22, 30:22, 31:24, 53:20) instead.
  test.skip('one-parameter overload, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(29, 22), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(functionsPath)]: [
            { range: makeRange(12, 13, 12, 16), newText: 'renamedFn' },
            { range: makeRange(29, 22, 29, 25), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Bug: renames record(msg.sender) (22:8) and misses the call inside record(address) (13:15).
  test.skip('same-arity overload told apart by type, from a member call', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(34, 22), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(7, 13, 7, 19), newText: 'renamedFn' },
            { range: makeRange(13, 15, 13, 21), newText: 'renamedFn' },
            { range: makeRange(23, 8, 23, 14), newText: 'renamedFn' },
            { range: makeRange(34, 22, 34, 28), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Bug: renames the record(uint256) call in its own body (13:15) and misses record(msg.sender) (22:8).
  test.skip('same-arity overload told apart by type, from the other declaration', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(12, 13), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(12, 13, 12, 19), newText: 'renamedFn' },
            { range: makeRange(22, 8, 22, 14), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit; the inherited overloaded emit is not found.
  test.skip('inherited overloaded event, from an emit', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(11, 13), 'EERNLoggedValue')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(logPath)]: [
            { range: makeRange(4, 10, 4, 16), newText: 'EERNLoggedValue' },
            { range: makeRange(9, 13, 9, 19), newText: 'EERNLoggedValue' },
          ],
          [toUri(userPath)]: [
            { range: makeRange(11, 13, 11, 19), newText: 'EERNLoggedValue' },
            { range: makeRange(27, 20, 27, 26), newText: 'EERNLoggedValue' },
          ],
        },
      })
    )
  })

  // Bug: renames only the declaration (Log.sol 5:10) and misses emit Logged(msg.sender).
  test.skip('second event overload, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(logPath), makePosition(5, 11), 'EERNLoggedWho')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(logPath)]: [{ range: makeRange(5, 10, 5, 16), newText: 'EERNLoggedWho' }],
          [toUri(userPath)]: [{ range: makeRange(12, 13, 12, 19), newText: 'EERNLoggedWho' }],
        },
      })
    )
  })
})
