import path from 'path'
import { TestLanguageClient } from '../src/TestLanguageClient'
import { Logger, LogLevel } from '../src/utils/Logger'

export function buildClient(rootPath: string) {
  const logger = new Logger(process.env.DEBUG === undefined ? LogLevel.INFO : LogLevel.TRACE)

  const serverModulePath = path.join(__dirname, '..', '..', '..', 'server', 'out', 'index.js')
  const workspaceFolderPaths = [rootPath]
  return new TestLanguageClient(serverModulePath, workspaceFolderPaths, logger)
}

let client: TestLanguageClient

export async function getInitializedClient() {
  if (client !== undefined) {
    return client
  }

  const rootPath = path.join(__dirname, '..', '..', 'integration', 'projects')

  client = buildClient(rootPath)

  client.start()
  await client.initialize()

  return client
}
