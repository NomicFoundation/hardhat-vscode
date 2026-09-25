import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

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

describe('[foundry] rename - assembly (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let refsPath: string
  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('foundry/src/references/assembly/AsmRefs.sol')
    defsPath = getProjectPath('foundry/src/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the edits outside assembly; the base of x.slot is not linked.
  test.skip('state variable used as x.slot, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(5, 20), 'asmRenamedStored')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(5, 20, 5, 26), newText: 'asmRenamedStored' },
            { range: makeRange(21, 8, 21, 14), newText: 'asmRenamedStored' },
            { range: makeRange(23, 19, 23, 25), newText: 'asmRenamedStored' },
            { range: makeRange(23, 42, 23, 48), newText: 'asmRenamedStored' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; the base of x.slot is not linked.
  test.skip('state variable from its use in x.slot', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(23, 42), 'asmRenamedStored')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(5, 20, 5, 26), newText: 'asmRenamedStored' },
            { range: makeRange(21, 8, 21, 14), newText: 'asmRenamedStored' },
            { range: makeRange(23, 19, 23, 25), newText: 'asmRenamedStored' },
            { range: makeRange(23, 42, 23, 48), newText: 'asmRenamedStored' },
          ],
        },
      })
    )
  })

  // Not implemented: returns only the declaration; the base of xs.offset and xs.length is not linked.
  test.skip('calldata parameter used as xs.offset and xs.length, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(defsPath), makePosition(24, 46), 'asmRenamedXs')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(24, 46, 24, 48), newText: 'asmRenamedXs' },
            { range: makeRange(26, 17, 26, 19), newText: 'asmRenamedXs' },
            { range: makeRange(27, 17, 27, 19), newText: 'asmRenamedXs' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; yul function parameters are not declarations.
  test.skip('yul function parameter from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(29, 28), 'asmRenamedP')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(29, 28, 29, 29), newText: 'asmRenamedP' },
            { range: makeRange(30, 25, 30, 26), newText: 'asmRenamedP' },
          ],
        },
      })
    )
  })

  // Not implemented: returns an empty edit; yul function return variables are not declarations.
  test.skip('yul function return variable from its use', async () => {
    const workspaceEdit = await client.rename(toUri(refsPath), makePosition(30, 16), 'asmRenamedQ')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refsPath)]: [
            { range: makeRange(29, 34, 29, 35), newText: 'asmRenamedQ' },
            { range: makeRange(30, 16, 30, 17), newText: 'asmRenamedQ' },
          ],
        },
      })
    )
  })
})
