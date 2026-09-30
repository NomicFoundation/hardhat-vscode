import { expect } from 'chai'
import { test } from 'mocha'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] definition - assembly (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let assemblyPath: string

  before(async () => {
    client = await getInitializedClient()
    assemblyPath = getProjectPath('foundry/src/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(assemblyPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns null; the AssemblyMemberAccess node never resolves its base.
  test.skip('storage variable in x.slot', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(19, 23))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(7, 20, 7, 25),
    })
  })

  // Not implemented: returns null; the AssemblyMemberAccess node never resolves its base.
  test.skip('storage variable in x.offset', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(20, 25))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(6, 20, 6, 27),
    })
  })

  // Not implemented: returns null; the AssemblyMemberAccess node never resolves its base.
  test.skip('calldata array in xs.offset in memory-safe assembly', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(26, 17))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(24, 46, 24, 48),
    })
  })

  // Not implemented: returns null; Yul function parameters and returns are not declarations.
  test.skip('yul function return variable used in the body', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(36, 16))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(34, 34, 34, 35),
    })
  })

  // Not implemented: returns null; the AssemblyMemberAccess node never resolves its base.
  test.skip('external function pointer in fp.address', async () => {
    const location = await client.findDefinition(toUri(assemblyPath), makePosition(54, 17))

    expect(location).to.deep.equal({
      uri: toUri(assemblyPath),
      range: makeRange(52, 33, 52, 35),
    })
  })
})
