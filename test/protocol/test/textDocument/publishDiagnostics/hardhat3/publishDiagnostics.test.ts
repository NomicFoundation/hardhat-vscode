import { expect } from 'chai'
import { test } from 'mocha'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makeRange, sleep } from '../../../helpers'

let client!: TestLanguageClient

describe('[hardhat3] publishDiagnostics', () => {
  before(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    client.clear()
    await client.closeAllDocuments()
  })

  test('missing semicolon', async function () {
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/MissingSemicolon.sol')
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/InvalidAssignment.sol')
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/MarkAbstract.sol')
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/UTF8Characters.sol')
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/File With Whitespaces.sol')
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/InvalidImport.sol')
    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'hardhat',
      severity: DiagnosticSeverity.Error,
      message: "doesn't exist",
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
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/NoLicense.sol')
    await client.openDocument(documentPath)

    // First assert the diagnostic is present
    await client.getDiagnostic(documentPath, {
      message: 'SPDX license identifier not provided',
    })
    expect(client.documents[toUri(documentPath)].diagnostics.length).to.eq(1)

    // Edit the file to make it correct
    await client.changeDocument(documentPath, makeRange(0, 0, 0, 0), '// SPDX-License-Identifier: MIT\n')

    // Assert diagnostics are gone
    await sleep(300) // TODO: change this to proper event listening for diagnostics
    expect(client.documents[toUri(documentPath)].diagnostics.length).to.eq(0)
  })

  describe('uninitialized immutable', function () {
    const documentPath = getProjectPath('hardhat3/contracts/diagnostics/UninitializedImmutable.sol')
    const message = 'Construction control flow ends without initializing all immutable state variables.'

    test('should point at the uninitialized variable', async () => {
      await client.openDocument(documentPath)

      await client.getDiagnostic(documentPath, {
        source: 'solidity',
        severity: DiagnosticSeverity.Error,
        message,
        // The whole declaration, terminating semicolon included - that is where
        // the declaration node ends.
        range: {
          start: { line: 6, character: 2 },
          end: { line: 6, character: 34 },
        },
      })
    })

    test('should point at the constructor of the offending contract', async () => {
      await client.openDocument(documentPath)

      await client.getDiagnostic(documentPath, {
        source: 'solidity',
        severity: DiagnosticSeverity.Error,
        message,
        range: {
          start: { line: 9, character: 2 },
          end: { line: 11, character: 3 },
        },
      })
    })

    test('should not touch initialized immutables or unrelated contracts', async () => {
      await client.openDocument(documentPath)

      // Wait for the diagnostics to land before inspecting the whole set.
      await client.getDiagnostic(documentPath, { message })

      const diagnostics = client.documents[toUri(documentPath)].diagnostics ?? []
      const startLines = diagnostics.filter((d) => d.message === message).map((d) => d.range.start.line)

      // Lines are 0-based here.
      // 7  -> `assignedInConstructor`, assigned in Bad's constructor
      // 16 -> `Good.ok`, a contract with no error at all
      // 18 -> Good's constructor
      expect(startLines).to.not.include(7)
      expect(startLines).to.not.include(16)
      expect(startLines).to.not.include(18)

      // And nothing beyond the two that belong to Bad.
      expect(startLines).to.deep.equal([6, 9])
    })
  })
})
