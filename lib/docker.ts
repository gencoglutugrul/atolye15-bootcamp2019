import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export const runContainer = async (
  image: string,
  workingPath: string
): Promise<string> => {
  try {
    const result = await execFileAsync(
      'docker',
      ['run', '-id', '-v', workingPath + ':/app', '-w', '/app', image]
    )
    return result.stdout.trim()
  } catch (err) {
    throw Error('Error: Container could not be run! ' + err.message)
  }
}

export const execOnContainer = async (
  container: string,
  command: string
): Promise<void> => {
  await execFileAsync(
    'docker',
    ['exec', container, 'bash', '-c', command]
  )
}

export const stopContainer = async (
  container: string
): Promise<void> => {
  await execFileAsync(
    'docker',
    ['stop', container]
  )
}

export const removeContainer = async (
  container: string
): Promise<void> => {
  await execFileAsync(
    'docker',
    ['rm', container]
  )
}
