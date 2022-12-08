import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange } from '../../../helpers'

let client!: TestLanguageClient

describe.only('[hardhat] rename', () => {
  let testPath: string
  let multiImportPath: string

  before(async () => {
    client = await getInitializedClient()

    testPath = getProjectPath('hardhat/contracts/rename/Test.sol')
    multiImportPath = getProjectPath('hardhat/contracts/rename/MultiImport.sol')

    await client.openDocument(testPath)
    await client.openDocument(multiImportPath)
  })

  after(async () => {
    client.closeAllDocuments()
  })

  test('[single-file][identifier] - rename', async function () {
    const workspaceEdit = await client.rename(toUri(testPath), makePosition(21, 17), 'newName')

    expect(workspaceEdit).to.deep.equal({
      changes: {
        [testPath]: [
          {
            range: makeRange(15, 22, 15, 31),
            newText: 'newName',
          },
          {
            range: makeRange(21, 12, 21, 21),
            newText: 'newName',
          },
          {
            range: makeRange(50, 15, 50, 24),
            newText: 'newName',
          },
          {
            range: makeRange(50, 25, 50, 34),
            newText: 'newName',
          },
        ],
      },
    })
  })

  test('[single-file][member access] - rename', async function () {
    const workspaceEdit = await client.rename(toUri(testPath), makePosition(35, 31), 'memberAccess')

    expect(workspaceEdit).to.deep.equal({
      changes: {
        [testPath]: [
          {
            range: makeRange(11, 16, 11, 24),
            newText: 'memberAccess',
          },
          {
            range: makeRange(35, 27, 35, 35),
            newText: 'memberAccess',
          },
          {
            range: makeRange(45, 12, 45, 20),
            newText: 'memberAccess',
          },
        ],
      },
    })
  })

  test('[multi-file][member access] - rename', async function () {
    const workspaceEdit = await client.rename(toUri(multiImportPath), makePosition(17, 42), 'name1')

    expect(workspaceEdit).to.deep.equal({
      changes: {
        [getProjectPath('hardhat/contracts/rename/Foo.sol')]: [
          {
            range: makeRange(6, 18, 6, 22),
            newText: 'name1',
          },
        ],
        [multiImportPath]: [
          {
            range: makeRange(13, 19, 13, 23),
            newText: 'name1',
          },
          {
            range: makeRange(17, 40, 17, 44),
            newText: 'name1',
          },
        ],
      },
    })
  })
})
