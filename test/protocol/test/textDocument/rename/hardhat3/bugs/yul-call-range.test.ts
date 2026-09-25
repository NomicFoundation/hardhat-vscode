import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[hardhat3] rename bug - yul call range covers the whole call', () => {
  let refsPath: string
  let defsPath: string
  let nestedPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('hardhat3/contracts/references/assembly/AsmRefs.sol')
    defsPath = getProjectPath('hardhat3/contracts/definition/assembly/AssemblyDefs.sol')
    nestedPath = getProjectPath('hardhat3/contracts/rename/bugs/yul-call-range/AsmRename.sol')

    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
    await client.openDocument(nestedPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
    await client.openDocument(nestedPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns each call edit as the whole call and past the line end (32:23-32:37, 33:17-33:33), deleting the arguments.
  test.skip('yul function from a call', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(33, 17), 'asmRenamedHelper')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(29, 21, 29, 27), newText: 'asmRenamedHelper' },
            { range: makeRange(32, 23, 32, 29), newText: 'asmRenamedHelper' },
            { range: makeRange(33, 17, 33, 23), newText: 'asmRenamedHelper' },
          ],
        },
      })
    )
  })

  // Bug: returns the call edit as the whole call and past the line end (42:23-42:37), deleting the argument.
  test.skip('yul function with the same name as one in another assembly block, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(39, 21), 'asmRenamedHelper')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(39, 21, 39, 27), newText: 'asmRenamedHelper' },
            { range: makeRange(42, 23, 42, 29), newText: 'asmRenamedHelper' },
          ],
        },
      })
    )
  })

  // Bug: returns each call edit as the whole call and past the line end (33:23-33:37, 39:28-39:42), deleting the arguments.
  test.skip('yul function called before its definition', async () => {
    const workspaceEdit = await client.rename(toUri(defsPath), makePosition(33, 23), 'asmRenamedTriple')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(34, 21, 34, 27), newText: 'asmRenamedTriple' },
            { range: makeRange(33, 23, 33, 29), newText: 'asmRenamedTriple' },
            { range: makeRange(39, 28, 39, 34), newText: 'asmRenamedTriple' },
          ],
        },
      })
    )
  })

  // Bug: returns overlapping edits for the nested calls (9:19-9:38, 9:24-9:37) and one edit over the whole split call (10:19-12:16).
  test.skip('yul function in a nested call and a call split over lines', async () => {
    const workspaceEdit = await client.rename(toUri(nestedPath), makePosition(9, 24), 'asmRenamedBump')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(nestedPath)]: [
            { range: makeRange(6, 21, 6, 25), newText: 'asmRenamedBump' },
            { range: makeRange(9, 19, 9, 23), newText: 'asmRenamedBump' },
            { range: makeRange(9, 24, 9, 28), newText: 'asmRenamedBump' },
            { range: makeRange(10, 19, 10, 23), newText: 'asmRenamedBump' },
          ],
        },
      })
    )
  })

  // Bug: renames the called function triple instead (34:21-34:27, 33:23-33:37, 39:28-39:42), since the call's range contains the argument.
  test.skip('yul variable from a yul call argument', async () => {
    const workspaceEdit = await client.rename(toUri(defsPath), makePosition(39, 35), 'asmRenamedI')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(38, 22, 38, 23), newText: 'asmRenamedI' },
            { range: makeRange(38, 34, 38, 35), newText: 'asmRenamedI' },
            { range: makeRange(38, 42, 38, 43), newText: 'asmRenamedI' },
            { range: makeRange(38, 51, 38, 52), newText: 'asmRenamedI' },
            { range: makeRange(39, 35, 39, 36), newText: 'asmRenamedI' },
          ],
        },
      })
    )
  })
})
