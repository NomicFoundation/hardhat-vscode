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

describe('[foundry] rename bug - names in an import brace list are never bound', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let refDefsPath: string
  let refUserPath: string
  let ifBasePath: string
  let ifUserAPath: string
  let ifUserBPath: string
  let ifUserCPath: string
  let dtShapesPath: string
  let dtBuilderPath: string

  before(async () => {
    client = await getInitializedClient()
    refDefsPath = getProjectPath('foundry/src/references/file-level/FlRefDefs.sol')
    refUserPath = getProjectPath('foundry/src/references/file-level/FlRefUser.sol')
    ifBasePath = getProjectPath('foundry/src/references/import-forms/IfBase.sol')
    ifUserAPath = getProjectPath('foundry/src/references/import-forms/IfUserA.sol')
    ifUserBPath = getProjectPath('foundry/src/references/import-forms/IfUserB.sol')
    ifUserCPath = getProjectPath('foundry/src/references/import-forms/IfUserC.sol')
    dtShapesPath = getProjectPath('foundry/src/rename/data-types/DtShapes.sol')
    dtBuilderPath = getProjectPath('foundry/src/rename/data-types/DtBuilder.sol')

    await client.openDocument(refDefsPath)
    await client.openDocument(refUserPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
    await client.openDocument(dtShapesPath)
    await client.openDocument(dtBuilderPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(refDefsPath)
    await client.openDocument(refUserPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
    await client.openDocument(dtShapesPath)
    await client.openDocument(dtBuilderPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns only the three edits in the declaring file; the brace entry and both calls in the importing file are missing.
  test.skip('free function imported by name, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(refDefsPath), makePosition(6, 10), 'flRescale')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refDefsPath)]: [
            { range: makeRange(6, 9, 6, 16), newText: 'flRescale' },
            { range: makeRange(11, 11, 11, 18), newText: 'flRescale' },
            { range: makeRange(11, 19, 11, 26), newText: 'flRescale' },
          ],
          [toUri(refUserPath)]: [
            { range: makeRange(3, 28, 3, 35), newText: 'flRescale' },
            { range: makeRange(6, 33, 6, 40), newText: 'flRescale' },
            { range: makeRange(11, 15, 11, 22), newText: 'flRescale' },
          ],
        },
      })
    )
  })

  // Bug: returns only the declaration; the brace entries and the call in the importing files are missing.
  test.skip('free function imported by name and under an alias, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(ifBasePath), makePosition(7, 9), 'IfRnDouble')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifBasePath)]: [{ range: makeRange(7, 9, 7, 17), newText: 'IfRnDouble' }],
          [toUri(ifUserAPath)]: [
            { range: makeRange(3, 17, 3, 25), newText: 'IfRnDouble' },
            { range: makeRange(12, 15, 12, 23), newText: 'IfRnDouble' },
          ],
          [toUri(ifUserBPath)]: [{ range: makeRange(3, 26, 3, 34), newText: 'IfRnDouble' }],
        },
      })
    )
  })

  // Bug: returns an empty edit; the aliased free function in the braces is never bound.
  test.skip('alias of an imported free function, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(ifUserBPath), makePosition(10, 21), 'IfRnTwice')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifUserBPath)]: [
            { range: makeRange(3, 38, 3, 43), newText: 'IfRnTwice' },
            { range: makeRange(10, 15, 10, 20), newText: 'IfRnTwice' },
            { range: makeRange(10, 21, 10, 26), newText: 'IfRnTwice' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit; the struct named in the import braces is never bound.
  test.skip('file-level struct imported by name, from a struct constructor', async () => {
    const workspaceEdit = await client.rename(toUri(dtBuilderPath), makePosition(14, 23), 'Crate')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dtShapesPath)]: [
            { range: makeRange(3, 7, 3, 10), newText: 'Crate' },
            { range: makeRange(12, 14, 12, 17), newText: 'Crate' },
          ],
          [toUri(dtBuilderPath)]: [
            { range: makeRange(3, 8, 3, 11), newText: 'Crate' },
            { range: makeRange(11, 4, 11, 7), newText: 'Crate' },
            { range: makeRange(14, 8, 14, 11), newText: 'Crate' },
            { range: makeRange(14, 23, 14, 26), newText: 'Crate' },
          ],
        },
      })
    )
  })

  // Bug: returns an empty edit; the imported struct is never bound, so neither is its member.
  test.skip('member of a struct imported by name, from a named field', async () => {
    const workspaceEdit = await client.rename(toUri(dtBuilderPath), makePosition(14, 28), 'span')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dtShapesPath)]: [
            { range: makeRange(4, 12, 4, 17), newText: 'span' },
            { range: makeRange(13, 13, 13, 18), newText: 'span' },
          ],
          [toUri(dtBuilderPath)]: [
            { range: makeRange(14, 28, 14, 33), newText: 'span' },
            { range: makeRange(16, 32, 16, 37), newText: 'span' },
          ],
        },
      })
    )
  })

  // Bug: returns only the two edits in the declaring file; the Pair in the import braces is missing.
  test.skip('file-level struct shadowed in the importing contract, from its declaration', async () => {
    const workspaceEdit = await client.rename(toUri(dtShapesPath), makePosition(8, 7), 'Duo')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(dtShapesPath)]: [
            { range: makeRange(8, 7, 8, 11), newText: 'Duo' },
            { range: makeRange(16, 15, 16, 19), newText: 'Duo' },
          ],
          [toUri(dtBuilderPath)]: [{ range: makeRange(3, 13, 3, 17), newText: 'Duo' }],
        },
      })
    )
  })
})
