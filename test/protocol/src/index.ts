import { readFileSync } from 'fs'
import path from 'path'
import { DidOpenTextDocumentNotification } from 'vscode-languageserver-protocol/node'
import { toUri } from './helpers'
import { TestLanguageClient } from './TestLanguageClient'
import { Logger, LogLevel } from './utils/Logger'

const main = async () => {
  const logger = new Logger(LogLevel.TRACE)

  const serverModulePath = path.join(__dirname, '..', '..', '..', 'server', 'out', 'index.js')
  const workspaceFolderPaths = [path.join(__dirname, '..', '..', 'integration', 'projects')]
  const client = new TestLanguageClient(serverModulePath, workspaceFolderPaths, logger)
  await client.start()

  const testUri = '/home/antico/webapps/vscode/hh-vscode/test/integration/projects/main/contracts/rename/Test.sol'
  const didOpenParams = {
    textDocument: {
      uri: toUri(testUri),
      languageId: 'solidity',
      version: 1,
      text: readFileSync(testUri).toString(),
    },
  }

  logger.info(`Sending ${didOpenParams}`)
  client.connection.sendNotification(DidOpenTextDocumentNotification.type, didOpenParams)
}

main()
