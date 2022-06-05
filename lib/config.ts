import * as Joi from 'joi'
import * as YAML from 'yaml'

import { readFile } from 'fs/promises'

export interface ITask{
  name: string,
  run: string
}

export interface IConfig{
  image: string
  runInParallel: boolean
  exitOnFailure: boolean
  before: ITask[]
  steps: ITask[]
  after: ITask[]
}

export const getConfig =
  async (configFile: string): Promise<IConfig> => {
    let fileExtension = configFile.split('.').pop()
    fileExtension = fileExtension === configFile ? '' : fileExtension
    fileExtension = fileExtension.toLowerCase()

    if (['json', 'yaml'].indexOf(fileExtension) === -1) {
      throw Error('Config file must be given in json or yaml format.')
    }

    const config = fileExtension === 'json'
      ? JSON.parse((await readFile(configFile)).toString())
      : YAML.parse((await readFile(configFile)).toString())

    const taskSchema = Joi.object({
      name: Joi.string().required(),
      run: Joi.string().required()
    })

    const { error, value: validatedConfig } = Joi.object({
      image: Joi.string().required(),
      runInParallel: Joi.bool().default(false),
      exitOnFailure: Joi.bool().default(true),
      before: Joi.array().items(taskSchema).required(),
      steps: Joi.array().items(taskSchema).required(),
      after: Joi.array().items(taskSchema).required()
    })
      .validate(config, { stripUnknown: true })

    if (error) {
      throw new Error(`Config validation error: ${error.message}`)
    }

    return validatedConfig
  }
