import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, runningOnWindows } from '../../../helpers'

let client!: TestLanguageClient

describe('[foundry] publishDiagnostics', () => {
  if (runningOnWindows()) {
    return // skip foundry on windows
  }

  beforeEach(async () => {
    client = await getInitializedClient()
    client.clearDiagnostics()
  })

  afterEach(async () => {
    client.closeAllDocuments()
  })

  describe('missing semicolon', function () {
    it('should publish diagnostics', async () => {
      const documentPath = getProjectPath('foundry/src/diagnostics/MissingSemicolon.sol')

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
  })
})
