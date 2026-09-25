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

describe('[foundry] rename - inheritance (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let derivedPath: string
  let overridesPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')
    overridesPath = getProjectPath('foundry/src/rename/inheritance/Overrides.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
    await client.openDocument(overridesPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
    await client.openDocument(overridesPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns no edits; a member reached through the receiver's base interface is not resolved.
  test.skip('override chain, from a call through a base interface', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(45, 33), 'valueRenamed')

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

  // Not implemented: returns only the override and the invocation; a modifier is not linked to the base modifier it overrides.
  test.skip('overridden modifier, from an invocation', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(38, 33), 'guardedRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(10, 13, 10, 20), newText: 'guardedRenamed' },
            { range: makeRange(30, 13, 30, 20), newText: 'guardedRenamed' },
            { range: makeRange(38, 33, 38, 40), newText: 'guardedRenamed' },
          ],
        },
      })
    )
  })

  // Not implemented: returns only the interface declaration; a public state variable is not linked to the interface function it implements.
  test.skip('interface function implemented by a public state variable, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(4, 13), 'totalRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(4, 13, 4, 18), newText: 'totalRenamed' },
            { range: makeRange(44, 28, 44, 33), newText: 'totalRenamed' },
            { range: makeRange(52, 21, 52, 26), newText: 'totalRenamed' },
            { range: makeRange(59, 28, 59, 33), newText: 'totalRenamed' },
          ],
        },
      })
    )
  })
})
