import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
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

describe('[foundry] rename bug - blocks do not open a scope', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let localsPath: string
  let scopingPath: string

  before(async () => {
    client = await getInitializedClient()
    localsPath = getProjectPath('foundry/src/references/variables/RvLocals.sol')
    scopingPath = getProjectPath('foundry/src/definition/variables/Scoping.sol')

    await client.openDocument(localsPath)
    await client.openDocument(scopingPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(localsPath)
    await client.openDocument(scopingPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: also renames the else block's use of its own k2 (39:16-39:18).
  test.skip('local in an if block, leaving the same-named local in the else block alone', async () => {
    const workspaceEdit = await client.rename(toUri(localsPath), makePosition(35, 20), 'bumped')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(localsPath)]: [
            { range: makeRange(35, 20, 35, 22), newText: 'bumped' },
            { range: makeRange(36, 16, 36, 18), newText: 'bumped' },
            { range: makeRange(36, 21, 36, 23), newText: 'bumped' },
          ],
        },
      })
    )
  })

  // Bug: returns only the declaration; its use is linked to the outer y.
  test.skip('local in a nested block that shadows an outer local, with its use', async () => {
    const workspaceEdit = await client.rename(toUri(scopingPath), makePosition(21, 20), 'nestedY')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(scopingPath)]: [
            { range: makeRange(21, 20, 21, 21), newText: 'nestedY' },
            { range: makeRange(22, 16, 22, 17), newText: 'nestedY' },
          ],
        },
      })
    )
  })
})
