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

describe('[hardhat3] rename bug - override chains linked by name alone and only to direct bases', () => {
  let basePath: string
  let derivedPath: string
  let overridesPath: string
  let functionsPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat3/contracts/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('hardhat3/contracts/definition/inheritance/Derived.sol')
    overridesPath = getProjectPath('hardhat3/contracts/rename/inheritance/Overrides.sol')
    functionsPath = getProjectPath('hardhat3/contracts/rename/functions/FunctionRename.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
    await client.openDocument(overridesPath)
    await client.openDocument(functionsPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
    await client.openDocument(overridesPath)
    await client.openDocument(functionsPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns 7 edits; the chain stops at direct bases, so IBase.value (4:13) and the call through IExtended (45:33) are missing.
  test.skip('override chain, from a base function', async () => {
    const workspaceEdit = await client.rename(toUri(basePath), makePosition(18, 13), 'valueRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [
            { range: makeRange(4, 13, 4, 18), newText: 'valueRenamed' },
            { range: makeRange(18, 13, 18, 18), newText: 'valueRenamed' },
          ],
          [toUri(derivedPath)]: [
            { range: makeRange(8, 13, 8, 18), newText: 'valueRenamed' },
            { range: makeRange(9, 21, 9, 26), newText: 'valueRenamed' },
            { range: makeRange(18, 13, 18, 18), newText: 'valueRenamed' },
            { range: makeRange(19, 20, 19, 25), newText: 'valueRenamed' },
            { range: makeRange(19, 36, 19, 41), newText: 'valueRenamed' },
            { range: makeRange(29, 17, 29, 22), newText: 'valueRenamed' },
            { range: makeRange(45, 33, 45, 38), newText: 'valueRenamed' },
          ],
        },
      })
    )
  })

  // Bug: also renames the overload tag(bytes32) (18:13) and its call (35:46), linked to the chain by name alone.
  test.skip('diamond override chain, from the overriding function', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(34, 13), 'tagRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(14, 13, 14, 16), newText: 'tagRenamed' },
            { range: makeRange(24, 13, 24, 16), newText: 'tagRenamed' },
            { range: makeRange(34, 13, 34, 16), newText: 'tagRenamed' },
            { range: makeRange(35, 22, 35, 25), newText: 'tagRenamed' },
            { range: makeRange(35, 38, 35, 41), newText: 'tagRenamed' },
            { range: makeRange(39, 15, 39, 18), newText: 'tagRenamed' },
          ],
        },
      })
    )
  })

  // Bug: returns 8 edits, the whole tag() chain as well, linked to the overload by name alone.
  test.skip('overload beside an override chain, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(35, 46), 'tagSaltRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(18, 13, 18, 16), newText: 'tagSaltRenamed' },
            { range: makeRange(35, 46, 35, 49), newText: 'tagSaltRenamed' },
          ],
        },
      })
    )
  })

  // Bug: returns 9 edits, adding the one-parameter overload's chain (6:13, 14:13, 25:41), linked by name alone.
  test.skip('overloaded override chain, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(25, 54), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(functionsPath)]: [
            { range: makeRange(4, 13, 4, 20), newText: 'renamedFn' },
            { range: makeRange(10, 13, 10, 20), newText: 'renamedFn' },
            { range: makeRange(20, 13, 20, 20), newText: 'renamedFn' },
            { range: makeRange(21, 21, 21, 28), newText: 'renamedFn' },
            { range: makeRange(25, 22, 25, 29), newText: 'renamedFn' },
            { range: makeRange(25, 54, 25, 61), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  // Bug: returns 9 edits, adding the zero-parameter overload's chain (4:13, 10:13, 20:13, 21:21, 25:22, 25:54), linked by name alone.
  test.skip('overloaded override chain, from the interface overload', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(6, 13), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(functionsPath)]: [
            { range: makeRange(6, 13, 6, 20), newText: 'renamedFn' },
            { range: makeRange(14, 13, 14, 20), newText: 'renamedFn' },
            { range: makeRange(25, 41, 25, 48), newText: 'renamedFn' },
          ],
        },
      })
    )
  })
})
