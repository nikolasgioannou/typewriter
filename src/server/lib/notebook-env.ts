import { mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const TYPEWRITER_DIR = join(homedir(), '.typewriter', 'notebooks')

export function getNotebookDir(notebookId: string): string {
  return join(TYPEWRITER_DIR, notebookId)
}

export async function ensureNotebookEnv(notebookId: string): Promise<string> {
  const dir = getNotebookDir(notebookId)
  await mkdir(dir, { recursive: true })

  const pkgPath = join(dir, 'package.json')
  const file = Bun.file(pkgPath)
  if (!(await file.exists())) {
    await Bun.write(
      pkgPath,
      JSON.stringify(
        {
          name: `typewriter-notebook-${notebookId}`,
          private: true,
          type: 'module',
        },
        null,
        2
      )
    )
  }

  return dir
}

export async function cleanupNotebookEnv(notebookId: string): Promise<void> {
  const { rm } = await import('node:fs/promises')
  const dir = getNotebookDir(notebookId)
  await rm(dir, { recursive: true, force: true })
}
