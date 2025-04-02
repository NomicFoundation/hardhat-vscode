import { expect } from 'chai'
import { renameSync } from 'fs'
import { FileChangeType } from 'vscode-languageserver-protocol'
import { toUri } from '../../src/helpers'
import { TestLanguageClient } from '../../src/TestLanguageClient'
import { getInitializedClient } from '../client'
import { getProjectPath } from '../helpers'

let client!: TestLanguageClient

describe('[misc] file rename', () => {
  const originalPath = getProjectPath('hardhat/contracts/misc/FileRename.sol')
  const renamedPath = getProjectPath('hardhat/contracts/misc/FileRename2.sol')

  beforeEach(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
    try {
      renameSync(renamedPath, originalPath)
    } catch (error) {
      //
    }
  })

  it('should be correctly indexed and its project assigned', async () => {
    const originalUri = toUri(originalPath)
    const renamedUri = toUri(renamedPath)

    // Open original file
    await client.openDocument(originalPath)

    // Emulate vscode rename: first send textDocument/didChange and then workspace/didChangeWatchedFiles
    renameSync(originalPath, renamedPath)
    await client.openDocument(renamedPath)

    await client.changeWatchedFiles({
      changes: [
        { type: FileChangeType.Deleted, uri: originalUri },
        { type: FileChangeType.Created, uri: renamedUri },
      ],
    })

    // Wait for renamed file to be analyzed
    await client.documents[renamedUri].waitAnalyzed

    // Assert there are no diagnostics (no import error, means project is assigned correctly)
    const document = client.documents[renamedUri]

    expect(document.diagnostics.length).to.eq(0)
  })
})
