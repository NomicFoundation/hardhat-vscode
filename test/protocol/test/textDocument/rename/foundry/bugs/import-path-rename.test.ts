import { expect } from 'chai'
import { test } from 'mocha'
import { TextEdit, WorkspaceEdit } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition } from '../../../../helpers'

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

describe('[foundry] rename bug - an import path string is renamed', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let libPath: string
  let importerPath: string
  let emitViaModulePath: string
  let ipBasePath: string
  let ipNestedPath: string
  let ipDeepPath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('foundry/src/definition/import-forms/Lib.sol')
    importerPath = getProjectPath('foundry/src/definition/import-forms/Importer.sol')
    emitViaModulePath = getProjectPath('foundry/src/definition/import-forms/EmitViaModule.sol')
    ipBasePath = getProjectPath('foundry/src/references/import-paths/IpBase.sol')
    ipNestedPath = getProjectPath('foundry/src/references/import-paths/nested/IpNested.sol')
    ipDeepPath = getProjectPath('foundry/src/references/import-paths/deep/inner/IpDeep.sol')

    await client.openDocument(libPath)
    await client.openDocument(importerPath)
    await client.openDocument(emitViaModulePath)
    await client.openDocument(ipBasePath)
    await client.openDocument(ipNestedPath)
    await client.openDocument(ipDeepPath)
  })

  async function reopen() {
    await client.closeAllDocuments()
    await client.openDocument(libPath)
    await client.openDocument(importerPath)
    await client.openDocument(emitViaModulePath)
    await client.openDocument(ipBasePath)
    await client.openDocument(ipNestedPath)
    await client.openDocument(ipDeepPath)
  }

  afterEach(reopen)

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns one edit under Lib.sol at 3:20-3:30, the path literal's range in Importer.sol.
  test('import path in the same directory', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(3, 23), 'IfRnPath').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })

  // Bug: returns one edit under IpBase.sol at 3:21-3:35, the path literal's range in IpNested.sol.
  test('import path into the parent directory', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipNestedPath), makePosition(3, 25), 'IpRenamedBase')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(sorted(workspaceEdit)).to.deep.equal({ changes: {} })
  })
})
