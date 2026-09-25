import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
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

describe('[hardhat] rename - functions (not implemented)', () => {
  let libPath: string
  let functionsPath: string
  let renamePath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('hardhat/contracts/definition/functions/FunctionsLib.sol')
    functionsPath = getProjectPath('hardhat/contracts/definition/functions/Functions.sol')
    renamePath = getProjectPath('hardhat/contracts/rename/functions/FunctionRename.sol')

    await client.openDocument(libPath)
    await client.openDocument(functionsPath)
    await client.openDocument(renamePath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(libPath)
    await client.openDocument(functionsPath)
    await client.openDocument(renamePath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration; a function named as a value is not linked.
  test('internal function used as a value, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(16, 13), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(functionsPath)]: [
            { range: makeRange(16, 13, 16, 19), newText: 'renamedFn' },
            { range: makeRange(36, 63, 36, 69), newText: 'renamedFn' },
            { range: makeRange(37, 31, 37, 37), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Not implemented: leaves out the named argument; named arguments are not bound to parameters.
  test('parameter bound by a named argument, from its use', async () => {
    const workspaceEdit = await client.rename(toUri(libPath), makePosition(14, 13), 'renamedParam')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(libPath)]: [
            { range: makeRange(12, 45, 12, 47), newText: 'renamedParam' },
            { range: makeRange(14, 13, 14, 15), newText: 'renamedParam' },
          ],
          [toUri(functionsPath)]: [{ range: makeRange(49, 28, 49, 30), newText: 'renamedParam' }],
        },
      })
    )
  })

  // Not implemented: leaves out the state variable and its use; a state variable does not join the override chain.
  test('interface function implemented by a public state variable, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(renamePath), makePosition(51, 36), 'renamedGetter')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(renamePath)]: [
            { range: makeRange(30, 13, 30, 20), newText: 'renamedGetter' },
            { range: makeRange(34, 28, 34, 35), newText: 'renamedGetter' },
            { range: makeRange(37, 8, 37, 15), newText: 'renamedGetter' },
            { range: makeRange(51, 36, 51, 43), newText: 'renamedGetter' },
          ],
        },
      })
    )
  })
})
