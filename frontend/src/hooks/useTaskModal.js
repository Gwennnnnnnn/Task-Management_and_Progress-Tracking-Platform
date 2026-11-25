// Hook to sync the open task modal with the URL (?task=<id>) so notifications
// and calendar links can deep-link to a task.

import { useSearchParams } from 'react-router-dom'
import { useCallback } from 'react'

export function useTaskModal() {
  const [params, setParams] = useSearchParams()
  const openTaskId = params.get('task')

  const openTask = useCallback(
    (id) => {
      const next = new URLSearchParams(params)
      next.set('task', id)
      setParams(next, { replace: false })
    },
    [params, setParams]
  )

  const closeTask = useCallback(() => {
    const next = new URLSearchParams(params)
    next.delete('task')
    setParams(next, { replace: false })
  }, [params, setParams])

  return { openTaskId, openTask, closeTask }
}
