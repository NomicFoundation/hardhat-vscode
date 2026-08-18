import { expect } from 'chai'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath } from '../../../helpers'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'

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

  describe('uninitialized immutable', function () {
    const documentPath = getProjectPath('foundry/src/diagnostics/UninitializedImmutable.sol')
    const message = 'Construction control flow ends without initializing all immutable state variables.'

    it('should point at the uninitialized variable', async () => {
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

    it('should point at the constructor of the offending contract', async () => {
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

    it('should not touch initialized immutables or unrelated contracts', async () => {
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
