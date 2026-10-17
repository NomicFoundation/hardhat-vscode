import { expect } from 'chai'
import { DiagnosticSeverity } from 'vscode-languageserver-protocol'
import { shouldSkipFoundryTests, toUri } from '../../../../src/helpers'
import { TestLanguageClient } from '../../../../src/TestLanguageClient'
import { getInitializedClient } from '../../../client'
import { getProjectPath, makePosition, makeRange, toUnixStyle } from '../../../helpers'

describe('[foundry] Soldeer library ownership', () => {
  if (shouldSkipFoundryTests()) return

  let client: TestLanguageClient
  const hook = getProjectPath('foundry-soldeer/dependencies/hooks/src/ManagedHook.sol')
  const token = getProjectPath('foundry-soldeer/vendor/token/Token.sol')
  const configPath = toUnixStyle(getProjectPath('foundry-soldeer/foundry.toml'))

  before(async () => {
    client = await getInitializedClient()
  })

  afterEach(async () => {
    await client.closeAllDocuments()
  })

  it('assigns libraries to the consuming project despite nested framework configs', async () => {
    for (const file of [hook, token]) {
      await client.getOrWaitNotification('custom/file-indexed', {
        uri: toUnixStyle(file),
        project: { frameworkName: 'Foundry', configPath },
      })
    }
  })

  it('resolves definitions across libraries using the consuming project remappings', async () => {
    await client.openDocument(hook)
    const location = await client.findDefinition(toUri(hook), makePosition(5, 6))
    expect(location).to.include({ uri: toUri(token) })
  })

  it('reports and clears compiler errors in an open dependency', async () => {
    const document = await client.openDocument(hook)
    expect(document.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error)).to.have.lengthOf(0)

    await client.changeDocument(hook, makeRange(10, 0, 10, 0), 'contract Broken { uint256 value = true; }\n')
    await document.waitValidated
    await client.getDiagnostic(hook, {
      severity: DiagnosticSeverity.Error,
      message: 'Type bool is not implicitly convertible to expected type uint256.',
    })

    await client.changeDocument(hook, makeRange(10, 0, 11, 0), '')
    await document.waitValidated
    expect(document.diagnostics.filter((d) => d.severity === DiagnosticSeverity.Error)).to.have.lengthOf(0)
  })
})
