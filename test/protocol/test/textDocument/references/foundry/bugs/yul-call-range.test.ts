import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../../src/helpers'
import { TestLanguageClient } from '../../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../../helpers'

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

describe('[foundry] references bug - yul call range covers the whole call', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let refsPath: string
  let defsPath: string

  before(async () => {
    client = await getInitializedClient()
    refsPath = getProjectPath('foundry/src/references/assembly/AsmRefs.sol')
    defsPath = getProjectPath('foundry/src/definition/assembly/AssemblyDefs.sol')

    await client.openDocument(refsPath)
    await client.openDocument(defsPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns each call's range as the whole call and past the line end (32:23-32:37, 33:17-33:33).
  test.skip('yul function, from its declaration', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(29, 21))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(29, 21, 29, 27) },
        { uri: toUri(refsPath), range: makeRange(32, 23, 32, 29) },
        { uri: toUri(refsPath), range: makeRange(33, 17, 33, 23) },
      ])
    )
  })

  // Bug: returns each call's range as the whole call and past the line end (32:23-32:37, 33:17-33:33).
  test.skip('yul function, from a call', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(33, 17))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(29, 21, 29, 27) },
        { uri: toUri(refsPath), range: makeRange(32, 23, 32, 29) },
        { uri: toUri(refsPath), range: makeRange(33, 17, 33, 23) },
      ])
    )
  })

  // Bug: returns the call's range as the whole call and past the line end (42:23-42:37).
  test.skip('yul function with a same-named one in another assembly block, from a call', async () => {
    const locations = await client.findReferences(toUri(refsPath), makePosition(42, 23))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(refsPath), range: makeRange(39, 21, 39, 27) },
        { uri: toUri(refsPath), range: makeRange(42, 23, 42, 29) },
      ])
    )
  })

  // Bug: returns each call's range as the whole call and past the line end (33:23-33:37, 39:28-39:42).
  test.skip('yul function called before its definition', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(33, 23))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(34, 21, 34, 27) },
        { uri: toUri(defsPath), range: makeRange(33, 23, 33, 29) },
        { uri: toUri(defsPath), range: makeRange(39, 28, 39, 34) },
      ])
    )
  })
})
