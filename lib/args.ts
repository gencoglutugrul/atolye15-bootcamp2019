import { constants } from 'fs'
import { access as fileAccess } from 'fs/promises'
import path from 'path'
import yargs from 'yargs'

export default async () => {
  const args = await yargs(process.argv.slice(2))
    .usage('Usage: squareci [options]')
    .options({
      config: {
        alias: 'c',
        describe: 'Config file to read. It can be a valid yml or json file.' +
      ' It it is not provided command tries to read .squareci.yml file or' +
      ' .squareci.json file in current working directory. If none of them' +
      ' have been provided then it raises an error.',
        type: 'string',
        default: ''
      },
      path: {
        alias: 'p',
        describe: 'Current working dir. The folder that mounted to the docker' +
      ' container. If it is not provided then cwd is used.',
        type: 'string',
        default: process.cwd()
      }
    }).argv

  if (args.config === '') {
    for (const file of ['.squareci.json', '.squareci.yaml']
      .map(file => path.join(process.cwd(), file))) {
      try {
        await fileAccess(file, constants.R_OK)
        args.config = file
        return args
      } catch (_) { }
    }

    throw Error('Error: No config file found!')
  }

  try {
    await fileAccess(args.config, constants.R_OK)
    return args
  } catch (_) { }

  throw Error(`Error: Given file "${args.config}" is not accessible!`)
}
