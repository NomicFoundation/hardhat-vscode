import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

// References come in no particular order: compare them as sets.
function sorted(locations: Location[]) {
  return [...locations].sort(
    (a, b) =>
      a.uri.localeCompare(b.uri) ||
      a.range.start.line - b.range.start.line ||
      a.range.start.character - b.range.start.character
  )
}

describe('[hardhat] references - import-forms (not implemented)', () => {
  let libPath: string
  let importerPath: string

  before(async () => {
    client = await getInitializedClient()
    libPath = getProjectPath('hardhat/contracts/definition/import-forms/Lib.sol')
    importerPath = getProjectPath('hardhat/contracts/definition/import-forms/Importer.sol')

    await client.openDocument(libPath)
    await client.openDocument(importerPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns the declaration, the name in the braces and the plain use; the two M.Token uses are not linked.
  test.skip('contract imported by name and through a module alias, from its declaration', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(16, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(16, 9, 16, 14) },
        { uri: toUri(importerPath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(importerPath), range: makeRange(10, 4, 10, 9) },
        { uri: toUri(importerPath), range: makeRange(12, 6, 12, 11) },
        { uri: toUri(importerPath), range: makeRange(28, 17, 28, 22) },
      ])
    )
  })

  // Not implemented: returns the declaration, the name in the braces and the plain use; the two M.Token uses are not linked.
  test.skip('contract imported by name and through a module alias, from the name in the import braces', async () => {
    const locations = await client.findReferences(toUri(importerPath), makePosition(3, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(16, 9, 16, 14) },
        { uri: toUri(importerPath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(importerPath), range: makeRange(10, 4, 10, 9) },
        { uri: toUri(importerPath), range: makeRange(12, 6, 12, 11) },
        { uri: toUri(importerPath), range: makeRange(28, 17, 28, 22) },
      ])
    )
  })

  // Not implemented: returns only the declaration; M.helper() and N.helper() are not linked.
  test.skip('free function called through module aliases, from its declaration', async () => {
    const locations = await client.findReferences(toUri(libPath), makePosition(12, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 9, 12, 15) },
        { uri: toUri(importerPath), range: makeRange(20, 17, 20, 23) },
        { uri: toUri(importerPath), range: makeRange(24, 17, 24, 23) },
      ])
    )
  })

  // Not implemented: returns no locations; N.helper() is not linked.
  test.skip('free function called through a module alias, from the call', async () => {
    const locations = await client.findReferences(toUri(importerPath), makePosition(24, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(libPath), range: makeRange(12, 9, 12, 15) },
        { uri: toUri(importerPath), range: makeRange(20, 17, 20, 23) },
        { uri: toUri(importerPath), range: makeRange(24, 17, 24, 23) },
      ])
    )
  })

  // Not implemented: returns no locations; module aliases are not bound.
  test.skip('module alias, from a use', async () => {
    const locations = await client.findReferences(toUri(importerPath), makePosition(12, 4))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(importerPath), range: makeRange(5, 12, 5, 13) },
        { uri: toUri(importerPath), range: makeRange(12, 4, 12, 5) },
        { uri: toUri(importerPath), range: makeRange(15, 44, 15, 45) },
        { uri: toUri(importerPath), range: makeRange(16, 15, 16, 16) },
        { uri: toUri(importerPath), range: makeRange(20, 15, 20, 16) },
        { uri: toUri(importerPath), range: makeRange(28, 15, 28, 16) },
        { uri: toUri(importerPath), range: makeRange(32, 15, 32, 16) },
      ])
    )
  })
})
