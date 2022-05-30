#!/usr/bin/env ts-node-script

import {
  execOnContainer,
  removeContainer,
  runContainer,
  stopContainer
} from '../lib/docker'

import Listr from 'listr'
import args from '../lib/args'
import { getConfig } from '../lib/config'

const main = async (): Promise<void> => {
  const argv = await args()
  const config = await getConfig(argv.config)

  const tasks = new Listr([
    {
      title: 'Running Up Container',
      task: (ctx) =>
        runContainer(
          config.image,
          argv.path
        ).then(container => {
          ctx.container = container
        })
    },
    {
      title: 'Running Before Stage',
      task: (ctx) => {
        return new Listr(config.before.map(
          task => ({
            title: task.name,
            task: () => execOnContainer(ctx.container, task.run)
          })
        ), { exitOnError: true })
      }
    },
    {
      title: 'Running Steps',
      task: (ctx) => new Listr(config.steps.map(
        task => ({
          title: task.name,
          task: () => execOnContainer(ctx.container, task.run)
        })
      ), {
        exitOnError: config.exitOnFailure,
        concurrent: config.runInParallel
      })
    },
    {
      title: 'Running After Stage',
      task: (ctx) => new Listr(config.after.map(
        task => ({
          title: task.name,
          task: () => execOnContainer(ctx.container, task.run)
        })
      ))
    }
  ])
  let container = null
  tasks.run({
    container
  })
    .then((ctx) => {
      container = ctx.container
    })
    .catch(err => {
      container = err.context.container
      console.error(err.message)
    })
    .finally(() => {
      if (container !== null) {
        const cleanUp = new Listr([
          {
            title: 'Stopping Container',
            task: () => stopContainer(container)
          },
          {
            title: 'Removing Container',
            task: () => removeContainer(container)
          }
        ])

        cleanUp.run().catch(e => console.error(e.message))
      }
    })
}

main()
