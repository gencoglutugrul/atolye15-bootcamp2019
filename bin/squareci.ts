#!/usr/bin/env ts-node-script

import { execOnContainer, removeContainer, runContainer, stopContainer } from '../lib/docker'

import getArgs from '../lib/args'
import { getConfig } from '../lib/config'

const main = async (): Promise<void> => {
  const argv = await getArgs()
  const config = await getConfig(argv.config)

  const container = await runContainer(config.image, argv.path)
  console.log(container)
  console.log(await execOnContainer(container, 'sleep 10 && cat done'))
  console.log(await stopContainer(container))
  console.log(await removeContainer(container))
}

main().catch(console.error)
