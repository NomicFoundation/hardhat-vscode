import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
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

describe('[foundry] references - inheritance (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let derivedPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/definition/inheritance/Base.sol')
    derivedPath = getProjectPath('foundry/src/definition/inheritance/Derived.sol')

    await client.openDocument(basePath)
    await client.openDocument(derivedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration; a member inherited from a base interface is never linked to its call.
  test.skip('interface function called through a child interface, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(4, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(4, 13, 4, 18) },
        { uri: toUri(derivedPath), range: makeRange(45, 33, 45, 38) },
      ])
    )
  })

  // Not implemented: returns an empty list; a member inherited from a base interface is never linked to its call.
  test.skip('interface function called through a child interface, from the call', async () => {
    const locations = await client.findReferences(toUri(derivedPath), makePosition(45, 34))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(4, 13, 4, 18) },
        { uri: toUri(derivedPath), range: makeRange(45, 33, 45, 38) },
      ])
    )
  })
})
