import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition } from '../../../../helpers'

let client!: TestLanguageClient

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
  test.skip('import path in the same directory', async () => {
    const workspaceEdit = await client.rename(toUri(importerPath), makePosition(3, 23), 'IfRnPath').catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })

  // Bug: returns one edit under IpBase.sol at 3:21-3:35, the path literal's range in IpNested.sol.
  test.skip('import path into the parent directory', async () => {
    const workspaceEdit = await client
      .rename(toUri(ipNestedPath), makePosition(3, 25), 'IpRenamedBase')
      .catch(() => null)

    // A refusal: no result, an error, or an edit that changes nothing.
    expect(Object.keys(workspaceEdit?.changes ?? {})).to.deep.equal([])
  })
})
