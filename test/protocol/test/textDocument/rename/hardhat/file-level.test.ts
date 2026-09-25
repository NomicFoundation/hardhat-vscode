import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
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

describe('[hardhat] rename - file-level', () => {
  let refDefsPath: string
  let refUserPath: string
  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    refDefsPath = getProjectPath('hardhat/contracts/references/file-level/FlRefDefs.sol')
    refUserPath = getProjectPath('hardhat/contracts/references/file-level/FlRefUser.sol')
    defsPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('hardhat/contracts/definition/file-level/FileLevelUser.sol')

    await client.openDocument(refDefsPath)
    await client.openDocument(refUserPath)
    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(refDefsPath)
    await client.openDocument(refUserPath)
    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract function shadowing a free function, from a call', async () => {
    const workspaceEdit = await client.rename(toUri(refDefsPath), makePosition(23, 16), 'flBump')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refDefsPath)]: [
            { range: makeRange(17, 13, 17, 20), newText: 'flBump' },
            { range: makeRange(23, 15, 23, 22), newText: 'flBump' },
          ],
        },
      })
    )
  })

  test('local shadowing a file-level constant, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(refDefsPath), makePosition(23, 29), 'FL_LOCAL_CAP')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(refDefsPath)]: [
            { range: makeRange(22, 16, 22, 24), newText: 'FL_LOCAL_CAP' },
            { range: makeRange(23, 28, 23, 36), newText: 'FL_LOCAL_CAP' },
          ],
        },
      })
    )
  })

  test('free function through a plain import, from a call in another file', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(13, 34), 'doubleIt')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(19, 9, 19, 14), newText: 'doubleIt' },
            { range: makeRange(24, 11, 24, 16), newText: 'doubleIt' },
            { range: makeRange(24, 17, 24, 22), newText: 'doubleIt' },
            { range: makeRange(46, 15, 46, 20), newText: 'doubleIt' },
          ],
          [toUri(userPath)]: [{ range: makeRange(13, 33, 13, 38), newText: 'doubleIt' }],
        },
      })
    )
  })

  test('file-level struct, from a use in another file', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(11, 19), 'Coord')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [
            { range: makeRange(5, 7, 5, 12), newText: 'Coord' },
            { range: makeRange(27, 15, 27, 20), newText: 'Coord' },
            { range: makeRange(27, 56, 27, 61), newText: 'Coord' },
            { range: makeRange(28, 11, 28, 16), newText: 'Coord' },
            { range: makeRange(31, 13, 31, 18), newText: 'Coord' },
            { range: makeRange(36, 23, 36, 28), newText: 'Coord' },
            { range: makeRange(41, 16, 41, 21), newText: 'Coord' },
            { range: makeRange(49, 19, 49, 24), newText: 'Coord' },
          ],
          [toUri(userPath)]: [
            { range: makeRange(5, 23, 5, 28), newText: 'Coord' },
            { range: makeRange(6, 19, 6, 24), newText: 'Coord' },
            { range: makeRange(11, 18, 11, 23), newText: 'Coord' },
            { range: makeRange(13, 8, 13, 13), newText: 'Coord' },
          ],
        },
      })
    )
  })

  test('file-level enum, from a member access in another file', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(9, 26), 'Hue')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [{ range: makeRange(10, 5, 10, 10), newText: 'Hue' }],
          [toUri(userPath)]: [
            { range: makeRange(9, 4, 9, 9), newText: 'Hue' },
            { range: makeRange(9, 25, 9, 30), newText: 'Hue' },
          ],
        },
      })
    )
  })

  test('file-level event, from an emit in another file', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(14, 14), 'Shifted')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(defsPath)]: [{ range: makeRange(17, 6, 17, 11), newText: 'Shifted' }],
          [toUri(userPath)]: [{ range: makeRange(14, 13, 14, 18), newText: 'Shifted' }],
        },
      })
    )
  })

  test('a name in a comment is refused', async () => {
    const workspaceEdit = await client.rename(toUri(refDefsPath), makePosition(5, 4), 'flRenamed').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  test('the using keyword is refused', async () => {
    const workspaceEdit = await client.rename(toUri(userPath), makePosition(5, 1), 'flRenamed').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
