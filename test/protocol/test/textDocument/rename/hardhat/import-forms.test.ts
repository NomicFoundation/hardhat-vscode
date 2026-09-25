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

describe('[hardhat] rename - import-forms', () => {
  let deepPath: string
  let midPath: string
  let importerPath: string
  let ifBasePath: string
  let ifUserAPath: string
  let ifUserBPath: string
  let ifUserCPath: string

  before(async () => {
    client = await getInitializedClient()
    deepPath = getProjectPath('hardhat/contracts/definition/import-forms/Deep.sol')
    midPath = getProjectPath('hardhat/contracts/definition/import-forms/Mid.sol')
    importerPath = getProjectPath('hardhat/contracts/definition/import-forms/Importer.sol')
    ifBasePath = getProjectPath('hardhat/contracts/references/import-forms/IfBase.sol')
    ifUserAPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserA.sol')
    ifUserBPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserB.sol')
    ifUserCPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserC.sol')

    await client.openDocument(deepPath)
    await client.openDocument(midPath)
    await client.openDocument(importerPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(deepPath)
    await client.openDocument(midPath)
    await client.openDocument(importerPath)
    await client.openDocument(ifBasePath)
    await client.openDocument(ifUserAPath)
    await client.openDocument(ifUserBPath)
    await client.openDocument(ifUserCPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract reached through two plain imports, leaving the import path alone', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(13, 4), 'IfRnDeep')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(deepPath)]: [{ range: makeRange(3, 9, 3, 13), newText: 'IfRnDeep' }],
          [toUri(midPath)]: [{ range: makeRange(5, 16, 5, 20), newText: 'IfRnDeep' }],
          [toUri(importerPath)]: [{ range: makeRange(13, 4, 13, 8), newText: 'IfRnDeep' }],
        },
      })
    )
  })

  test('constant from the import braces, leaving a shadowing parameter alone', async () => {
    const workspaceEdit = await client.rename(toUri(ifUserAPath), makePosition(3, 37), 'IF_RN_LIMIT')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifBasePath)]: [
            { range: makeRange(3, 17, 3, 25), newText: 'IF_RN_LIMIT' },
            { range: makeRange(13, 15, 13, 23), newText: 'IF_RN_LIMIT' },
          ],
          [toUri(ifUserAPath)]: [
            { range: makeRange(3, 37, 3, 45), newText: 'IF_RN_LIMIT' },
            { range: makeRange(11, 16, 11, 24), newText: 'IF_RN_LIMIT' },
          ],
        },
      })
    )
  })

  test('parameter that shadows an imported constant', async () => {
    const workspaceEdit = await client.rename(toUri(ifUserAPath), makePosition(16, 15), 'ifRnParam')

    expect(sorted(workspaceEdit)).to.deep.equal(
      sorted({
        changes: {
          [toUri(ifUserAPath)]: [
            { range: makeRange(15, 28, 15, 36), newText: 'ifRnParam' },
            { range: makeRange(16, 15, 16, 23), newText: 'ifRnParam' },
          ],
        },
      })
    )
  })
})
