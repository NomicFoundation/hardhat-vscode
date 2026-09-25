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

describe('[foundry] rename - functions', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let libPath: string
  let functionsPath: string
  let renamePath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('foundry/src/definition/functions/FunctionsLib.sol')
    functionsPath = getProjectPath('foundry/src/definition/functions/Functions.sol')
    renamePath = getProjectPath('foundry/src/rename/functions/FunctionRename.sol')

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

  test('external function, from a call with call options', async () => {
    const workspaceEdit = await client.rename(toUri(functionsPath), makePosition(46, 14), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(libPath)]: [{ range: makeRange(12, 13, 12, 20), newText: 'renamedFn' }],
          [toUri(functionsPath)]: [
            { range: makeRange(46, 14, 46, 21), newText: 'renamedFn' },
            { range: makeRange(47, 79, 47, 86), newText: 'renamedFn' },
            { range: makeRange(49, 19, 49, 26), newText: 'renamedFn' },
            { range: makeRange(59, 20, 59, 27), newText: 'renamedFn' },
            { range: makeRange(61, 43, 61, 50), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  test('named argument of an overload is refused, only because named arguments are not linked', async () => {
    const workspaceEdit = await client
      .rename(toUri(functionsPath), makePosition(31, 35), 'renamedParam')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  test('parameter that shadows a function, from its use', async () => {
    const workspaceEdit = await client.rename(toUri(renamePath), makePosition(47, 15), 'renamedParam')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(renamePath)]: [
            { range: makeRange(46, 33, 46, 41), newText: 'renamedParam' },
            { range: makeRange(47, 15, 47, 23), newText: 'renamedParam' },
          ],
        },
      })
    )
  })

  test('function shadowed by a parameter, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(renamePath), makePosition(51, 15), 'renamedFn')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(renamePath)]: [
            { range: makeRange(42, 13, 42, 21), newText: 'renamedFn' },
            { range: makeRange(51, 15, 51, 23), newText: 'renamedFn' },
          ],
        },
      })
    )
  })

  test('built-in selector member is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(functionsPath), makePosition(58, 22), 'renamedMember')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
