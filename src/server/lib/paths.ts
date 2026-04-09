export function getNotebooksDir(): string {
  return process.env['NOTEBOOKS_DIR'] || process.cwd()
}
