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

describe('[hardhat] rename - data-types (not implemented)', () => {
  let registryPath: string
  let dataTypesPath: string

  before(async () => {
    client = await getInitializedClient()
    registryPath = getProjectPath('hardhat/contracts/definition/data-types/Registry.sol')
    dataTypesPath = getProjectPath('hardhat/contracts/definition/data-types/DataTypes.sol')

    await client.openDocument(registryPath)
    await client.openDocument(dataTypesPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(registryPath)
    await client.openDocument(dataTypesPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns 5 of the 8 edits; nested[..][..].a, outers.push().a and build().a are not linked.
  test('struct member from a use, through nested mappings, push() and a return', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(25, 17), 'quantity')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dataTypesPath)]: [
            { range: makeRange(16, 16, 16, 17), newText: 'quantity' },
            { range: makeRange(25, 17, 25, 18), newText: 'quantity' },
            { range: makeRange(29, 37, 29, 38), newText: 'quantity' },
            { range: makeRange(33, 22, 33, 23), newText: 'quantity' },
            { range: makeRange(38, 32, 38, 33), newText: 'quantity' },
            { range: makeRange(39, 17, 39, 18), newText: 'quantity' },
            { range: makeRange(39, 23, 39, 24), newText: 'quantity' },
            { range: makeRange(43, 23, 43, 24), newText: 'quantity' },
          ],
        },
      })
    )
  })

  // Not implemented: returns 5 of the 8 edits; nested[..][..].a, outers.push().a and build().a are not linked.
  test('struct member from a named constructor field', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(38, 32), 'quantity')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dataTypesPath)]: [
            { range: makeRange(16, 16, 16, 17), newText: 'quantity' },
            { range: makeRange(25, 17, 25, 18), newText: 'quantity' },
            { range: makeRange(29, 37, 29, 38), newText: 'quantity' },
            { range: makeRange(33, 22, 33, 23), newText: 'quantity' },
            { range: makeRange(38, 32, 38, 33), newText: 'quantity' },
            { range: makeRange(39, 17, 39, 18), newText: 'quantity' },
            { range: makeRange(39, 23, 39, 24), newText: 'quantity' },
            { range: makeRange(43, 23, 43, 24), newText: 'quantity' },
          ],
        },
      })
    )
  })

  // Not implemented: misses Entry in the qualified type name Registry.Entry memory e.
  test('struct of another contract from a qualified expression', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(55, 43), 'Swatch')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(registryPath)]: [{ range: makeRange(9, 11, 9, 16), newText: 'Swatch' }],
          [toUri(dataTypesPath)]: [
            { range: makeRange(55, 17, 55, 22), newText: 'Swatch' },
            { range: makeRange(55, 43, 55, 48), newText: 'Swatch' },
          ],
        },
      })
    )
  })

  // Not implemented: returns no edits; e's qualified type Registry.Entry is not resolved.
  test("member of another contract's struct through a qualified type", async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(56, 17), 'mode')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(registryPath)]: [{ range: makeRange(10, 13, 10, 17), newText: 'mode' }],
          [toUri(dataTypesPath)]: [{ range: makeRange(56, 17, 56, 21), newText: 'mode' }],
        },
      })
    )
  })

  // Not implemented: returns only the Registry.sol edits; Registry.Kind in a return type and in Registry.Kind.Big are not linked.
  test('enum of another contract used through qualified names', async () => {
    const workspaceEdit = await client.rename(toUri(registryPath), makePosition(4, 9), 'Mode')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(registryPath)]: [
            { range: makeRange(4, 9, 4, 13), newText: 'Mode' },
            { range: makeRange(10, 8, 10, 12), newText: 'Mode' },
          ],
          [toUri(dataTypesPath)]: [
            { range: makeRange(54, 53, 54, 57), newText: 'Mode' },
            { range: makeRange(55, 58, 55, 62), newText: 'Mode' },
          ],
        },
      })
    )
  })
})
