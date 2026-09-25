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

describe('[hardhat] rename - inheritance', () => {
  let basePath: string
  let derivedPath: string
  let overridesPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat/contracts/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('hardhat/contracts/definition/inheritance/Derived.sol')
    overridesPath = getProjectPath('hardhat/contracts/rename/inheritance/Overrides.sol')

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

  test('base contract, from a qualified call', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(19, 15), 'BaseRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(11, 18, 11, 22), newText: 'BaseRenamed' }],
          [toUri(derivedPath)]: [
            { range: makeRange(3, 8, 3, 12), newText: 'BaseRenamed' },
            { range: makeRange(5, 19, 5, 23), newText: 'BaseRenamed' },
            { range: makeRange(6, 18, 6, 22), newText: 'BaseRenamed' },
            { range: makeRange(19, 15, 19, 19), newText: 'BaseRenamed' },
            { range: makeRange(27, 18, 27, 22), newText: 'BaseRenamed' },
          ],
        },
      })
    )
  })

  test('base contract, from a base constructor call in a constructor', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(6, 18), 'BaseRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [{ range: makeRange(11, 18, 11, 22), newText: 'BaseRenamed' }],
          [toUri(derivedPath)]: [
            { range: makeRange(3, 8, 3, 12), newText: 'BaseRenamed' },
            { range: makeRange(5, 19, 5, 23), newText: 'BaseRenamed' },
            { range: makeRange(6, 18, 6, 22), newText: 'BaseRenamed' },
            { range: makeRange(19, 15, 19, 19), newText: 'BaseRenamed' },
            { range: makeRange(27, 18, 27, 22), newText: 'BaseRenamed' },
          ],
        },
      })
    )
  })

  test('contract, from an override specifier', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(22, 36), 'MiddleRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(derivedPath)]: [
            { range: makeRange(5, 9, 5, 15), newText: 'MiddleRenamed' },
            { range: makeRange(17, 17, 17, 23), newText: 'MiddleRenamed' },
            { range: makeRange(22, 36, 22, 42), newText: 'MiddleRenamed' },
            { range: makeRange(35, 8, 35, 14), newText: 'MiddleRenamed' },
            { range: makeRange(35, 27, 35, 33), newText: 'MiddleRenamed' },
          ],
        },
      })
    )
  })

  test('contract, from new with a salt', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(36, 26), 'LeafRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(derivedPath)]: [
            { range: makeRange(17, 9, 17, 13), newText: 'LeafRenamed' },
            { range: makeRange(36, 8, 36, 12), newText: 'LeafRenamed' },
            { range: makeRange(36, 26, 36, 30), newText: 'LeafRenamed' },
            { range: makeRange(41, 21, 41, 25), newText: 'LeafRenamed' },
          ],
        },
      })
    )
  })

  test('interface, from its import', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(3, 14), 'IExtendedRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [
            { range: makeRange(7, 10, 7, 19), newText: 'IExtendedRenamed' },
            { range: makeRange(11, 26, 11, 35), newText: 'IExtendedRenamed' },
          ],
          [toUri(derivedPath)]: [
            { range: makeRange(3, 14, 3, 23), newText: 'IExtendedRenamed' },
            { range: makeRange(41, 38, 41, 47), newText: 'IExtendedRenamed' },
            { range: makeRange(45, 15, 45, 24), newText: 'IExtendedRenamed' },
          ],
        },
      })
    )
  })

  test('inherited state variable, from a use two levels down', async () => {
    const workspaceEdit = await client.rename(toUri(derivedPath), makePosition(23, 8), 'storedRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(basePath)]: [
            { range: makeRange(12, 21, 12, 27), newText: 'storedRenamed' },
            { range: makeRange(15, 8, 15, 14), newText: 'storedRenamed' },
            { range: makeRange(19, 15, 19, 21), newText: 'storedRenamed' },
          ],
          [toUri(derivedPath)]: [
            { range: makeRange(13, 8, 13, 14), newText: 'storedRenamed' },
            { range: makeRange(23, 8, 23, 14), newText: 'storedRenamed' },
            { range: makeRange(29, 8, 29, 14), newText: 'storedRenamed' },
          ],
        },
      })
    )
  })

  test('interface function implemented without override, from a call (linked by name only)', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(59, 43), 'peekRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(6, 13, 6, 17), newText: 'peekRenamed' },
            { range: makeRange(51, 13, 51, 17), newText: 'peekRenamed' },
            { range: makeRange(59, 43, 59, 47), newText: 'peekRenamed' },
          ],
        },
      })
    )
  })

  test('local shadowing an inherited state variable, from its use', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(59, 15), 'limitLocalRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(58, 16, 58, 21), newText: 'limitLocalRenamed' },
            { range: makeRange(59, 15, 59, 20), newText: 'limitLocalRenamed' },
          ],
        },
      })
    )
  })

  test('inherited state variable shadowed by a local, from a use', async () => {
    const workspaceEdit = await client.rename(toUri(overridesPath), makePosition(63, 15), 'limitRenamed')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(overridesPath)]: [
            { range: makeRange(45, 21, 45, 26), newText: 'limitRenamed' },
            { range: makeRange(48, 8, 48, 13), newText: 'limitRenamed' },
            { range: makeRange(63, 15, 63, 20), newText: 'limitRenamed' },
          ],
        },
      })
    )
  })

  test('super is refused', async () => {
    const workspaceEdit = await client
      .rename(toUri(derivedPath), makePosition(19, 30), 'superRenamed')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
