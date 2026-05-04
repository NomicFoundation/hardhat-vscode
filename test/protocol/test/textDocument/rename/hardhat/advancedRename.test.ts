import { expect } from 'chai'
import { test } from 'mocha'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] advancedRename', () => {
  let inheritedPath: string

  before(async () => {
    client = await getInitializedClient()

    inheritedPath = getProjectPath('hardhat/contracts/rename/Inherited.sol')

    await client.openDocument(inheritedPath)
  })

  after(async () => {
    await client.closeAllDocuments()
  })

  test('[inheritance] rename action on interface renames across hierarchy', async function () {
    // Line 4 (0-indexed): "    function action() external returns (uint256);"
    // "action" starts at character 13
    const workspaceEdit = await client.rename(toUri(inheritedPath), makePosition(4, 13), 'newAction')

    expect(workspaceEdit).to.not.be.null
    expect(workspaceEdit).to.have.property('changes')

    const changes = workspaceEdit!.changes![toUri(inheritedPath)]
    expect(changes).to.be.an('array')
    expect(changes.length).to.be.at.least(2)

    // Should include the interface definition (line 4, char 13)
    const interfaceEdit = changes.find((edit) => edit.range.start.line === 4 && edit.range.start.character === 13)
    expect(interfaceEdit).to.not.be.undefined
  })
})
