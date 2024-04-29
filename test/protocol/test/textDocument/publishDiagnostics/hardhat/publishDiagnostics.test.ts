import { expect } from 'chai'
import { test } from 'mocha'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makeRange, sleep } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat] publishDiagnostics', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.clear()
    client.closeAllDocuments()
  })

  test('missing semicolon', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/MissingSemicolon.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: "Expected ';' but got '}'",
      range: {
        start: {
          line: 5,
          character: 0,
        },
        end: {
          line: 5,
          character: 1,
        },
      },
    })
  })

  test('invalid assignment', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/InvalidAssignment.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: 'Type bool is not implicitly convertible to expected type uint256',
      range: {
        start: {
          line: 7,
          character: 11,
        },
        end: {
          line: 7,
          character: 16,
        },
      },
    })
  })

  test('mark as abstract', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/MarkAbstract.sol')
    await client.openDocument(documentPath)
    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: 'Contract "Counter" should be marked as abstract',
      range: {
        start: {
          line: 7,
          character: 9,
        },
        end: {
          line: 7,
          character: 16,
        },
      },
    })
  })

  test('utf-8 character encodings', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/UTF8Characters.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: 'Different number of arguments in return statement',
      range: {
        start: {
          line: 7,
          character: 4,
        },
        end: {
          line: 7,
          character: 14,
        },
      },
    })
  })

  test('file with whitespaces', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/File With Whitespaces.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: 'Expected pragma, import directive',
      range: {
        start: {
          line: 0,
          character: 0,
        },
        end: {
          line: 0,
          character: 3,
        },
      },
    })
  })

  test('hardhat build error - non existing import', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/InvalidImport.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'hardhat',
      severity: DiagnosticSeverity.Error,
      message: 'Imported file not found',
      range: {
        start: {
          line: 4,
          character: 8,
        },
        end: {
          line: 4,
          character: 25,
        },
      },
    })
  })

  test('clear diagnostics on valid compilation', async function () {
    const documentPath = getProjectPath('hardhat/contracts/diagnostics/NoLicense.sol')
    await client.openDocument(documentPath)

    // First assert the diagnostic is present
    await client.getDiagnostic(documentPath, {
      message: 'SPDX license identifier not provided',
    })
    expect(client.documents[toUri(documentPath)].diagnostics.length).to.eq(1)

    // Edit the file to make it correct
    client.changeDocument(documentPath, makeRange(0, 0, 0, 0), '// SPDX-License-Identifier: MIT\n')

    // Assert diagnostics are gone
    await sleep(300) // TODO: change this to proper event listening for diagnostics
    expect(client.documents[toUri(documentPath)].diagnostics.length).to.eq(0)
  })
})
