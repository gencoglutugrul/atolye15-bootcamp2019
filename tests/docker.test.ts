import * as docker from '../lib/docker'

import { execFile } from 'child_process'
import path from 'path'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

describe('Docker Service', () => {
  let container = null
  const workingPath = path.join(process.cwd(), 'tests')
  beforeAll(async () => {
    container = await docker.runContainer(
      'alpine:latest',
      workingPath
    )
  })

  afterAll(async () => {
  }, 20000)

  it('Should run new container', async () => {
    const result = await execFileAsync(
      'docker',
      ['ps', '-q', '--filter', `id=${container}`]
    )

    expect(container.length).toBeGreaterThan(0)
    expect(result.stdout.trim().length).toBeGreaterThan(0)
  })

  it('Should bind working path as volume', async () => {
    const result = await execFileAsync(
      'docker',
      ['inspect', container]
    )

    expect(result.stderr.trim().length).toEqual(0)

    const json = JSON.parse(result.stdout)[0]
    expect(json.HostConfig.Binds.length).toEqual(1)
    expect(json.HostConfig.Binds[0]).toEqual(`${workingPath}:/app`)
  })

  it('Should exec command on container', async () => {
    const result = await docker.execOnContainer(container, 'echo hello-world')

    expect(result.stdout.trim()).toEqual('hello-world')
  })

  it('Should stop container', async () => {
    await docker.stopContainer(container)

    const result = await execFileAsync(
      'docker',
      ['ps', '-q', '--filter', `id=${container}`, '--filter', 'status=exited']
    )

    expect(result.stdout.trim().length).toBeGreaterThan(0)
  }, 20000)

  it('Should remove container', async () => {
    await docker.removeContainer(container)

    const result = await execFileAsync(
      'docker',
      ['ps', '-q', '--filter', `id=${container}`]
    )

    expect(result.stdout.trim().length).toEqual(0)
  })
})
