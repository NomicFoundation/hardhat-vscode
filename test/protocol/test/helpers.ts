import path from 'path'

export function getProjectPath(partialPath: string) {
  return path.join(__dirname, '..', 'projects', partialPath)
}
