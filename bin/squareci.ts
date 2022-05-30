#!/usr/bin/env ts-node-script

import {
  execOnContainer,
  removeContainer,
  runContainer,
  stopContainer
} from '../lib/docker'

import args from '../lib/args'
import { getConfig } from '../lib/config'
import ora from 'ora'
import { runWithSpinner } from '../lib/worker'

let container
const main = async (): Promise<void> => {
  const argv = await args()
  const config = await getConfig(argv.config)
  container = await runContainer(
    config.image,
    argv.path,
    ora('Running Up Container\nMounting Working Path as volume')
  )

  const beforeTasks = config.before.map(
    t => execOnContainer(container, t.run, ora({ text: t.name, indent: 4 }))
  )
  try {
    await runWithSpinner(
      beforeTasks,
      ora('Running before stage'),
      { stopOnFailure: config.exitOnFailure }
    )
  } catch (_) {
    throw Error('Failed on running before stage!')
  }

  const taskList = config.steps.map(
    t => execOnContainer(
      container,
      t.run,
      ora({ text: t.name, indent: 4 })
    )
  )

  await runWithSpinner(
    taskList,
    ora('Running steps'),
    {
      parallel: config.runInParallel,
      stopOnFailure: config.exitOnFailure
    }
  )

  const afterTasks = config.after.map(
    t => execOnContainer(
      container,
      t.run,
      ora({ text: t.name, indent: 4 })
    )
  )

  await runWithSpinner(
    afterTasks,
    ora('Running after steps'),
    { stopOnFailure: config.exitOnFailure }
  )

  await stopContainer(container, ora('Stopping container'))
  await removeContainer(container, ora('Removing container'))
}

main()
  .catch(console.error)
  .finally(() => {
    stopContainer(container, ora('Trying to stop container')).then(res => {
      if (res) {
        removeContainer(container, ora('Trying to remove container'))
      }
    })
  })
