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
  } catch (_) {
    throw Error('Error: Container could not be run!')
  }
}

export const execOnContainer = async (
  container: string,
  command: string
): Promise<boolean> => {
  try {
    await execFileAsync(
      'docker',
      ['exec', container, 'bash', '-c', command]
    )
  } catch (_) {
    return false
  }

  return true
}

export const stopContainer = async (container: string): Promise<boolean> => {
  try {
    await execFileAsync(
      'docker',
      ['stop', container]
    )
  } catch (_) {
    return false
  }

  return true
}

export const removeContainer = async (container: string): Promise<boolean> => {
  try {
    await execFileAsync(
      'docker',
      ['rm', container]
    )
  } catch (_) {
    return false
  }

  return true
}
