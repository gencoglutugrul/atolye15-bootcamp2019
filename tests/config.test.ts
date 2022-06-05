import * as YAML from 'yaml'
import * as fs from 'fs/promises'

import { IConfig, ITask, getConfig } from '../lib/config'

import path from 'path'
import { tmpdir } from 'os'

describe('Config Module', () => {
  const tempDir = path.join(tmpdir(), 'square_ci')
  const exampleTask: ITask = {
    name: 'test',
    run: 'echo 1'
  }

  const exampleConfig: IConfig = {
    image: 'node:latest',
    runInParallel: true,
    exitOnFailure: false,
    before: [exampleTask],
    steps: [exampleTask],
    after: [exampleTask]
  }

  beforeAll(() => {
    fs.mkdir(tempDir)
  })

  afterAll(() => {
    fs.rm(tempDir, {
      force: true,
      recursive: true
    })
  })

  it('Should throw error if file extension is not json or yaml', async () => {
    await expect(getConfig('test.notJsonOrYaml'))
      .rejects
      .toThrow(Error)

    await expect(getConfig('testWithoutExtension'))
      .rejects
      .toThrow(Error)
  })

  it('Should throw an error if the file does not exist', async () => {
    await expect(getConfig('nonExistentFile.json'))
      .rejects
      .toThrow()
  })

  it('Should throw an error if content does not fit in schema', async () => {
    for (const field of Object.keys(exampleConfig)) {
      // these field have default values
      if (['runInParallel', 'exitOnFailure'].indexOf(field) !== -1) { continue }

      const newData = Object.assign({}, exampleConfig)
      delete newData[field]

      const configFile = path.join(tempDir, `without-${field}.json`)
      await fs.writeFile(
        configFile,
        JSON.stringify(newData)
      )

      await expect(getConfig(configFile))
        .rejects
        .toThrow()
    }
  })

  it('Should strip unnecessary fields', async () => {
    const configFile = path.join(tempDir, 'full-config.yaml')
    const newConfig = Object.assign({}, exampleConfig, { trash: 1 })
    await fs.writeFile(
      configFile,
      YAML.stringify(newConfig)
    )
    const result = await getConfig(configFile)
    expect(result).toEqual(exampleConfig)
  })
})
