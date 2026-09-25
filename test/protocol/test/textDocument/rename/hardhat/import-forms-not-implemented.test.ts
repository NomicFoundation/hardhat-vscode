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

describe('[hardhat] rename - import-forms (not implemented)', () => {
  let libPath: string
  let importerPath: string
  let emitViaModulePath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('hardhat/contracts/definition/import-forms/Lib.sol')
    importerPath = getProjectPath('hardhat/contracts/definition/import-forms/Importer.sol')
    emitViaModulePath = getProjectPath('hardhat/contracts/definition/import-forms/EmitViaModule.sol')

    await client.openDocument(libPath)
    await client.openDocument(importerPath)
    await client.openDocument(emitViaModulePath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(libPath)
    await client.openDocument(importerPath)
    await client.openDocument(emitViaModulePath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: misses the two uses through the module alias M.
  test('contract named in braces, including its uses through a module alias', async () => {
    const workspaceEdit = await client.rename(toUri(libPath), makePosition(16, 9), 'IfRnLibToken')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(libPath)]: [{ range: makeRange(16, 9, 16, 14), newText: 'IfRnLibToken' }],
          [toUri(importerPath)]: [
            { range: makeRange(3, 8, 3, 13), newText: 'IfRnLibToken' },
            { range: makeRange(10, 4, 10, 9), newText: 'IfRnLibToken' },
            { range: makeRange(12, 6, 12, 11), newText: 'IfRnLibToken' },
            { range: makeRange(28, 17, 28, 22), newText: 'IfRnLibToken' },
          ],
        },
      })
    )
  })

  // Not implemented: returns no edits; module aliases are not bound.
  test('module alias from import * as M', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(12, 4), 'IfRnModule')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(importerPath)]: [
            { range: makeRange(5, 12, 5, 13), newText: 'IfRnModule' },
            { range: makeRange(12, 4, 12, 5), newText: 'IfRnModule' },
            { range: makeRange(15, 44, 15, 45), newText: 'IfRnModule' },
            { range: makeRange(16, 15, 16, 16), newText: 'IfRnModule' },
            { range: makeRange(20, 15, 20, 16), newText: 'IfRnModule' },
            { range: makeRange(28, 15, 28, 16), newText: 'IfRnModule' },
            { range: makeRange(32, 15, 32, 16), newText: 'IfRnModule' },
          ],
        },
      })
    )
  })

  // Not implemented: returns no edits; module aliases are not bound.
  test('module alias from import "x" as N', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(24, 15), 'IfRnModuleN')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(importerPath)]: [
            { range: makeRange(6, 22, 6, 23), newText: 'IfRnModuleN' },
            { range: makeRange(24, 15, 24, 16), newText: 'IfRnModuleN' },
          ],
        },
      })
    )
  })

  // Not implemented: returns no edits; members of a module alias are not linked.
  test('free function reached through a module alias', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(24, 17), 'IfRnHelper')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(libPath)]: [{ range: makeRange(12, 9, 12, 15), newText: 'IfRnHelper' }],
          [toUri(importerPath)]: [
            { range: makeRange(20, 17, 20, 23), newText: 'IfRnHelper' },
            { range: makeRange(24, 17, 24, 23), newText: 'IfRnHelper' },
          ],
        },
      })
    )
  })
})
