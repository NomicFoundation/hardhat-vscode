import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'
import { shouldSkipFoundryTests } from '../../../../src/helpers'

let client!: TestLanguageClient

describe('[foundry] publishDiagnostics', () => {
  if (shouldSkipFoundryTests()) {
    return
  }

  beforeEach(async () => {
    client = await getInitializedClient()
    client.clear()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
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
