import { expect } from 'chai'
import { test } from 'mocha'
import { Location } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../../src/helpers'
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

describe('[hardhat] references bug - an alias re-imported from the file that made it loses its name in the braces', () => {
  let basePath: string
  let userAPath: string
  let userBPath: string
  let userCPath: string

  before(async () => {
    client = await getInitializedClient()
    basePath = getProjectPath('hardhat/contracts/references/import-forms/IfBase.sol')
    userAPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserA.sol')
    userBPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserB.sol')
    userCPath = getProjectPath('hardhat/contracts/references/import-forms/IfUserC.sol')

    await client.openDocument(basePath)
    await client.openDocument(userAPath)
    await client.openDocument(userBPath)
    await client.openDocument(userCPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  // Bug: returns every location except the re-imported Vault in IfUserC's import braces.
  test.skip('contract behind a re-imported alias, from its declaration', async () => {
    const locations = await client.findReferences(toUri(basePath), makePosition(11, 10))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(11, 9, 11, 16) },
        { uri: toUri(userAPath), range: makeRange(3, 8, 3, 15) },
        { uri: toUri(userAPath), range: makeRange(7, 4, 7, 11) },
        { uri: toUri(userBPath), range: makeRange(3, 8, 3, 15) },
        { uri: toUri(userBPath), range: makeRange(3, 19, 3, 24) },
        { uri: toUri(userBPath), range: makeRange(6, 4, 6, 9) },
        { uri: toUri(userBPath), range: makeRange(7, 4, 7, 9) },
        { uri: toUri(userCPath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(userCPath), range: makeRange(6, 4, 6, 9) },
      ])
    )
  })

  // Bug: returns every location except the re-imported Vault in IfUserC's import braces.
  test.skip('contract behind a re-imported alias, from a use of the re-imported alias', async () => {
    const locations = await client.findReferences(toUri(userCPath), makePosition(6, 5))

    expect(sorted(locations)).to.deep.equal(
      sorted([
        { uri: toUri(basePath), range: makeRange(11, 9, 11, 16) },
        { uri: toUri(userAPath), range: makeRange(3, 8, 3, 15) },
        { uri: toUri(userAPath), range: makeRange(7, 4, 7, 11) },
        { uri: toUri(userBPath), range: makeRange(3, 8, 3, 15) },
        { uri: toUri(userBPath), range: makeRange(3, 19, 3, 24) },
        { uri: toUri(userBPath), range: makeRange(6, 4, 6, 9) },
        { uri: toUri(userBPath), range: makeRange(7, 4, 7, 9) },
        { uri: toUri(userCPath), range: makeRange(3, 8, 3, 13) },
        { uri: toUri(userCPath), range: makeRange(6, 4, 6, 9) },
      ])
    )
  })
})
