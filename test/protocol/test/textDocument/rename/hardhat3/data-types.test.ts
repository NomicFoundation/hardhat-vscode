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

describe('[hardhat3] rename - data-types', () => {
  let registryPath: string
  let dataTypesPath: string
  let shapesPath: string
  let builderPath: string
  let membersPath: string

  before(async () => {
    client = await getInitializedClient()
    registryPath = getProjectPath('hardhat3/contracts/definition/data-types/Registry.sol')
    dataTypesPath = getProjectPath('hardhat3/contracts/definition/data-types/DataTypes.sol')
    shapesPath = getProjectPath('hardhat3/contracts/rename/data-types/DtShapes.sol')
    builderPath = getProjectPath('hardhat3/contracts/rename/data-types/DtBuilder.sol')
    membersPath = getProjectPath('hardhat3/contracts/references/data-types/DtMembers.sol')

    await client.openDocument(registryPath)
    await client.openDocument(dataTypesPath)
    await client.openDocument(shapesPath)
    await client.openDocument(builderPath)
    await client.openDocument(membersPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(registryPath)
    await client.openDocument(dataTypesPath)
    await client.openDocument(shapesPath)
    await client.openDocument(builderPath)
    await client.openDocument(membersPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('struct type from a named constructor', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(38, 25), 'Carton')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dataTypesPath)]: [
            { range: makeRange(15, 11, 15, 16), newText: 'Carton' },
            { range: makeRange(20, 4, 20, 9), newText: 'Carton' },
            { range: makeRange(21, 42, 21, 47), newText: 'Carton' },
            { range: makeRange(24, 21, 24, 26), newText: 'Carton' },
            { range: makeRange(37, 8, 37, 13), newText: 'Carton' },
            { range: makeRange(37, 25, 37, 30), newText: 'Carton' },
            { range: makeRange(38, 8, 38, 13), newText: 'Carton' },
            { range: makeRange(38, 25, 38, 30), newText: 'Carton' },
            { range: makeRange(46, 44, 46, 49), newText: 'Carton' },
            { range: makeRange(47, 15, 47, 20), newText: 'Carton' },
          ],
        },
      })
    )
  })

  test('enum type from type(E).max', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(51, 49), 'Tint')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dataTypesPath)]: [
            { range: makeRange(6, 9, 6, 14), newText: 'Tint' },
            { range: makeRange(50, 45, 50, 50), newText: 'Tint' },
            { range: makeRange(50, 52, 50, 57), newText: 'Tint' },
            { range: makeRange(50, 59, 50, 64), newText: 'Tint' },
            { range: makeRange(51, 16, 51, 21), newText: 'Tint' },
            { range: makeRange(51, 32, 51, 37), newText: 'Tint' },
            { range: makeRange(51, 49, 51, 54), newText: 'Tint' },
          ],
        },
      })
    )
  })

  test('enum member from its use', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(51, 22), 'Crimson')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dataTypesPath)]: [
            { range: makeRange(7, 8, 7, 11), newText: 'Crimson' },
            { range: makeRange(51, 22, 51, 25), newText: 'Crimson' },
          ],
        },
      })
    )
  })

  test("struct member from an array index, leaving another struct's same-named member", async () => {
    const workspaceEdit = await client.rename(toUri(membersPath), makePosition(20, 37), 'coord')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(membersPath)]: [
            { range: makeRange(5, 16, 5, 17), newText: 'coord' },
            { range: makeRange(20, 25, 20, 26), newText: 'coord' },
            { range: makeRange(20, 37, 20, 38), newText: 'coord' },
            { range: makeRange(20, 48, 20, 49), newText: 'coord' },
            { range: makeRange(24, 15, 24, 16), newText: 'coord' },
            { range: makeRange(25, 25, 25, 26), newText: 'coord' },
          ],
        },
      })
    )
  })

  test('shadowing contract struct from its constructor (imported one untouched only by accident)', async () => {
    const workspaceEdit = await client.rename(toUri(builderPath), makePosition(21, 24), 'Couple')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(builderPath)]: [
            { range: makeRange(6, 11, 6, 15), newText: 'Couple' },
            { range: makeRange(21, 8, 21, 12), newText: 'Couple' },
            { range: makeRange(21, 24, 21, 28), newText: 'Couple' },
          ],
        },
      })
    )
  })

  test('refuses a built-in array push', async () => {
    const workspaceEdit = await client.rename(toUri(dataTypesPath), makePosition(33, 15), 'append2').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })
})
