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

describe('[foundry] references - import-paths', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  let basePath: string
  let nestedPath: string
  let deepPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('foundry/src/references/import-paths/IpBase.sol')
    nestedPath = getProjectPath('foundry/src/references/import-paths/nested/IpNested.sol')
    deepPath = getProjectPath('foundry/src/references/import-paths/deep/inner/IpDeep.sol')

    await client.openDocument(basePath)
    await client.openDocument(nestedPath)
    await client.openDocument(deepPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('contract in a parent directory, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(3, 9))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })

  test('contract in a parent directory, from its name in a ../ import', async () => {
    const locations = await client.findReferences(toUri(nestedPath), makePosition(3, 8))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })

  test('contract in a parent directory, from a use two directories down', async () => {
    const locations = await client.findReferences(toUri(deepPath), makePosition(9, 20))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(3, 9, 3, 15) },
        { uri: toUri(nestedPath), range: makeRange(3, 8, 3, 14) },
        { uri: toUri(nestedPath), range: makeRange(6, 21, 6, 27) },
        { uri: toUri(deepPath), range: makeRange(6, 4, 6, 10) },
        { uri: toUri(deepPath), range: makeRange(8, 36, 8, 42) },
        { uri: toUri(deepPath), range: makeRange(9, 20, 9, 26) },
      ])
    )
  })
})
