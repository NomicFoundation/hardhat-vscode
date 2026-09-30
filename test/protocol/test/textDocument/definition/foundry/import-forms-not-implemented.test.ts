import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition - import-forms (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let importerPath: string
  let libPath: string
  let emitPath: string

  before(async () => {
    client = await getInitializedClient()
    importerPath = getProjectPath('foundry/src/definition/import-forms/Importer.sol')
    libPath = getProjectPath('foundry/src/definition/import-forms/Lib.sol')
    emitPath = getProjectPath('foundry/src/definition/import-forms/EmitViaModule.sol')

    await client.openDocument(importerPath)
    await client.openDocument(libPath)
    await client.openDocument(emitPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null.
  test.skip('module alias from import * as M', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(12, 4))

    expect(location).to.deep.equal({
      uri: toUri(importerPath),
      range: makeRange(5, 12, 5, 13),
    })
  })

  // Not implemented: returns null.
  test.skip('contract type through a module alias', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(12, 7))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(16, 9, 16, 14),
    })
  })

  // Not implemented: returns null.
  test.skip('struct constructor through a module alias', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(16, 18))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(3, 7, 3, 12),
    })
  })

  // Not implemented: returns null.
  test.skip('free function through a module alias', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(20, 18))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 9, 12, 15),
    })
  })

  // Not implemented: returns null.
  test.skip('free function through an import "x" as N alias', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(24, 18))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(12, 9, 12, 15),
    })
  })

  // Not implemented: returns null.
  test.skip('contract function in M.C.f.selector', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(28, 24))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(17, 13, 17, 17),
    })
  })

  // Not implemented: returns null.
  test.skip('error in revert through a module alias', async () => {
    const location = await client.findDefinition(toUri(importerPath), makePosition(32, 18))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(8, 6, 8, 10),
    })
  })

  // Not implemented: returns null.
  test.skip('file-level event emitted through a module alias', async () => {
    const location = await client.findDefinition(toUri(emitPath), makePosition(7, 16))

    expect(location).to.deep.equal({
      uri: toUri(libPath),
      range: makeRange(10, 6, 10, 8),
    })
  })
})
