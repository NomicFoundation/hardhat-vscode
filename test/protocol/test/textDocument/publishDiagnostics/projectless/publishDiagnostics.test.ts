import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'

let client!: TestLanguageClient

describe('[projectless] publishDiagnostics', () => {
  beforeEach(async () => {
    client = await getInitializedClient()
    client.clearDiagnostics()
  })

  describe('missing semicolon', function () {
    it('should publish diagnostics', async () => {
      const documentPath = getProjectPath('projectless/src/diagnostics/MissingSemicolon.sol')

      client.openDocument(documentPath)

      await client.assertDiagnostic(documentPath, {
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
