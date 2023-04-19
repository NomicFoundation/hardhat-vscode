import { test } from 'mocha'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[truffle] publishDiagnostics', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
    client.clear()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  test('missing semicolon', async function () {
    const documentPath = getProjectPath('truffle/my_contracts/diagnostics/MissingSemicolon.sol')

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

  test('non existing import', async function () {
    const documentPath = getProjectPath('truffle/my_contracts/diagnostics/ImportNonexistent.sol')

    await client.openDocument(documentPath)

    await client.getDiagnostic(documentPath, {
      source: 'solidity',
      severity: DiagnosticSeverity.Error,
      message: 'File not found',
      range: {
        start: {
          line: 4,
          character: 0,
        },
        end: {
          line: 4,
          character: 27,
        },
      },
    })
  })
})
