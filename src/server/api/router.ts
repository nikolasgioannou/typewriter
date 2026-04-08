import { notebooksRouter } from './notebooks'
import { router } from './trpc'

export const appRouter = router({
  notebooks: notebooksRouter,
})

export type AppRouter = typeof appRouter
