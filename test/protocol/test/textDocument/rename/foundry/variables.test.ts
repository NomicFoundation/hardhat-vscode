import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// A WorkspaceEdit can carry its edits in `changes` or in `documentChanges`, and
// the edits within a file come in no particular order. Normalise both to sorted
// `changes` of plain `{ range, newText }` edits, leaving out files with no edits.
// File operations (create, rename, delete) are kept apart under `operations`, so
// an answer that includes any never compares equal to an edit or a refusal.
function sorted(edit: WorkspaceEdit | null) {
  const changes: Record<string, TextEdit[]> = {}
  const operations: unknown[] = []
  const add = (uri: string, edits: TextEdit[]) => {
    if (edits.length > 0) {
      changes[uri] = [...(changes[uri] ?? []), ...edits.map(({ range, newText }) => ({ range, newText }))].sort(
        (a, b) => a.range.start.line - b.range.start.line || a.range.start.character - b.range.start.character
      )
    }
  }
  for (const [uri, edits] of Object.entries(edit?.changes ?? {})) {
    add(uri, edits)
  }
  for (const change of edit?.documentChanges ?? []) {
    if ('edits' in change) {
      add(change.textDocument.uri, change.edits as TextEdit[])
    } else {
      operations.push(change)
    }
  }
  return operations.length > 0 ? { changes, operations } : { changes }
}

describe('[foundry] rename - variables', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let vaultPath: string
  let localsPath: string
  let transientPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/references/variables/RvBase.sol')
    vaultPath = getProjectPath('foundry/src/references/variables/RvVault.sol')
    localsPath = getProjectPath('foundry/src/references/variables/RvLocals.sol')
    transientPath = getProjectPath('foundry/src/references/variables/RvTransient.sol')

    await client.openDocument(basePath)
    await client.openDocument(vaultPath)
    await client.openDocument(localsPath)
    await client.openDocument(transientPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(vaultPath)
    await client.openDocument(localsPath)
    await client.openDocument(transientPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('modifier from an invocation in a derived contract in another file', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(10, 47), 'onlyOperator')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(12, 13, 12, 22), newText: 'onlyOperator' }],
          [toUri(vaultPath)]: [
            { range: makeRange(6, 46, 6, 55), newText: 'onlyOperator' },
            { range: makeRange(10, 47, 10, 56), newText: 'onlyOperator' },
          ],
        },
      })
    )
  })

  test('function parameter from its use as a call argument, including its use as a modifier argument', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(7, 32), 'quantity')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(vaultPath)]: [
            { range: makeRange(6, 29, 6, 35), newText: 'quantity' },
            { range: makeRange(6, 75, 6, 81), newText: 'quantity' },
            { range: makeRange(7, 19, 7, 25), newText: 'quantity' },
            { range: makeRange(7, 32, 7, 38), newText: 'quantity' },
          ],
        },
      })
    )
  })

  test('inherited state variable from a modifier argument, leaving same-named parameter and member alone', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(10, 64), 'pooled')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(5, 21, 5, 28), newText: 'pooled' }],
          [toUri(vaultPath)]: [
            { range: makeRange(7, 8, 7, 15), newText: 'pooled' },
            { range: makeRange(10, 64, 10, 71), newText: 'pooled' },
            { range: makeRange(11, 8, 11, 15), newText: 'pooled' },
          ],
        },
      })
    )
  })

  test('immutable from its constructor assignment, leaving the word in a string alone', async () => {
    const workspaceEdit = await client.rename(toUri(basePath), makePosition(9, 8), 'overseer')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [
            { range: makeRange(6, 31, 6, 36), newText: 'overseer' },
            { range: makeRange(9, 8, 9, 13), newText: 'overseer' },
            { range: makeRange(13, 30, 13, 35), newText: 'overseer' },
          ],
          [toUri(vaultPath)]: [{ range: makeRange(15, 22, 15, 27), newText: 'overseer' }],
        },
      })
    )
  })

  test('constant from a qualified use', async () => {
    const workspaceEdit = await client.rename(toUri(vaultPath), makePosition(6, 70), 'MAX_CAP')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [
            { range: makeRange(4, 30, 4, 33), newText: 'MAX_CAP' },
            { range: makeRange(18, 25, 18, 28), newText: 'MAX_CAP' },
          ],
          [toUri(vaultPath)]: [{ range: makeRange(6, 70, 6, 73), newText: 'MAX_CAP' }],
        },
      })
    )
  })

  test('state variable from a use, leaving the local that shadows it alone', async () => {
    const workspaceEdit = await client.rename(toUri(localsPath), makePosition(14, 15), 'grandTotal')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(localsPath)]: [
            { range: makeRange(4, 19, 4, 24), newText: 'grandTotal' },
            { range: makeRange(10, 8, 10, 13), newText: 'grandTotal' },
            { range: makeRange(14, 15, 14, 20), newText: 'grandTotal' },
          ],
        },
      })
    )
  })

  test('local that shadows a state variable, leaving the state variable alone', async () => {
    const workspaceEdit = await client.rename(toUri(localsPath), makePosition(18, 16), 'localTotal')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(localsPath)]: [
            { range: makeRange(18, 16, 18, 21), newText: 'localTotal' },
            { range: makeRange(19, 8, 19, 13), newText: 'localTotal' },
            { range: makeRange(20, 15, 20, 20), newText: 'localTotal' },
          ],
        },
      })
    )
  })

  test('transient state variable from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(transientPath), makePosition(6, 22), 'ticks')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(transientPath)]: [
            { range: makeRange(6, 22, 6, 29), newText: 'ticks' },
            { range: makeRange(17, 8, 17, 15), newText: 'ticks' },
            { range: makeRange(18, 15, 18, 22), newText: 'ticks' },
          ],
        },
      })
    )
  })

  test('word inside a string is refused', async () => {
    const workspaceEdit = await client.rename(toUri(basePath), makePosition(13, 42), 'overseer').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })
})
