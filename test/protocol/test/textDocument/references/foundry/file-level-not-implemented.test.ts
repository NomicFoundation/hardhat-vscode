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

describe('[foundry] references - file-level (not implemented)', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let defsPath: string
  let userPath: string

  before(async () => {
    client = await getInitializedClient()
    defsPath = getProjectPath('foundry/src/definition/file-level/FileLevelDefs.sol')
    userPath = getProjectPath('foundry/src/definition/file-level/FileLevelUser.sol')

    await client.openDocument(defsPath)
    await client.openDocument(userPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Not implemented: returns only the declaration; the using {sum} entries and attached calls are not linked.
  test.skip('free function attached with using {f}, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(31, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(31, 9, 31, 12) },
        { uri: toUri(defsPath), range: makeRange(41, 7, 41, 10) },
        { uri: toUri(defsPath), range: makeRange(50, 17, 50, 20) },
        { uri: toUri(userPath), range: makeRange(5, 14, 5, 17) },
        { uri: toUri(userPath), range: makeRange(15, 17, 15, 20) },
      ])
    )
  })

  // Not implemented: returns an empty list; the attached call through using {sum} is not linked.
  test.skip('free function attached with using {f}, from an attached call', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(15, 18))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(31, 9, 31, 12) },
        { uri: toUri(defsPath), range: makeRange(41, 7, 41, 10) },
        { uri: toUri(defsPath), range: makeRange(50, 17, 50, 20) },
        { uri: toUri(userPath), range: makeRange(5, 14, 5, 17) },
        { uri: toUri(userPath), range: makeRange(15, 17, 15, 20) },
      ])
    )
  })

  // Not implemented: returns only the declaration; the attached call through using PointLib is not linked.
  test.skip('library function attached with using L, from its declaration', async () => {
    const locations = await client.findReferences(toUri(defsPath), makePosition(36, 14))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(36, 13, 36, 22) },
        { uri: toUri(userPath), range: makeRange(15, 27, 15, 36) },
      ])
    )
  })

  // Not implemented: returns an empty list; the attached call through using PointLib is not linked.
  test.skip('library function attached with using L, from an attached call', async () => {
    const locations = await client.findReferences(toUri(userPath), makePosition(15, 28))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(defsPath), range: makeRange(36, 13, 36, 22) },
        { uri: toUri(userPath), range: makeRange(15, 27, 15, 36) },
      ])
    )
  })
})
