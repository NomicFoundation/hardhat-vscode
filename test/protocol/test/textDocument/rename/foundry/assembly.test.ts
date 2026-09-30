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

describe('[foundry] rename - assembly', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let refsPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('foundry/src/references/assembly/AsmRefs.sol')

    await client.openDocument(refsPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(refsPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('solidity parameter from its use in assembly', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(12, 25), 'asmRenamedBase')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(7, 27, 7, 31), newText: 'asmRenamedBase' },
            { range: makeRange(8, 25, 8, 29), newText: 'asmRenamedBase' },
            { range: makeRange(12, 25, 12, 29), newText: 'asmRenamedBase' },
            { range: makeRange(14, 24, 14, 28), newText: 'asmRenamedBase' },
          ],
        },
      })
    )
  })

  test('yul let local with the same name as one in another assembly block', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(43, 17), 'asmRenamedTmp')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(42, 16, 42, 19), newText: 'asmRenamedTmp' },
            { range: makeRange(43, 17, 43, 20), newText: 'asmRenamedTmp' },
          ],
        },
      })
    )
  })

  test('slot suffix of x.slot is refused', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(23, 26), 'asmRenamedSlot').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })

  test('yul built-in is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(refsPath), makePosition(23, 12), 'asmRenamedSstore')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })
})
