import { Ora } from 'ora'

interface Options{
  parallel?: boolean
  stopOnFailure: boolean
}

export const runInParallel = async (
  taskList: Promise<boolean>[]
) => {
  let tasksResult = true
  for (const result of await Promise.all(taskList)) {
    tasksResult = tasksResult && result
  }
  return tasksResult
}

export const runInConcurrency = async (
  taskList: Promise<boolean>[]
) => {
  let tasksResult = true
  for (const task of taskList) {
    tasksResult = tasksResult && await task
  }
  return tasksResult
}

export const runWithSpinner = (
  taskList: Promise<boolean>[],
  spinner: Ora,
  options?: Options
) => {
  spinner.start()

  options = {
    parallel: false,
    ...options
  }

  if (options.stopOnFailure) {
    taskList.map(t => t.catch(_ => false))
  }

  const worker = options.parallel ? runInParallel : runInConcurrency
  const result = worker(taskList)

  result ? spinner.succeed() : spinner.fail()
  return result
}
