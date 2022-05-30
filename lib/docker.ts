import { Ora } from 'ora'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export const runContainer = async (
  image: string,
  workingPath: string,
  spinner?: Ora
): Promise<string> => {
  spinner?.start()
  try {
    const result = await execFileAsync(
      'docker',
      ['run', '-id', '-v', workingPath + ':/app', '-w', '/app', image]
    )
    spinner?.succeed()
    return result.stdout.trim()
  } catch (_) {
    spinner?.fail()
    throw Error('Error: Container could not be run!')
  }
}

export const execOnContainer = async (
  container: string,
  command: string,
  spinner?: Ora
): Promise<boolean> => {
  spinner?.start()
  try {
    await execFileAsync(
      'docker',
      ['exec', container, 'bash', '-c', command]
    )
    spinner?.succeed()
  } catch (err) {
    spinner?.fail()
    throw err
  }

  return true
}

export const stopContainer = async (
  container: string,
  spinner?: Ora
): Promise<boolean> => {
  spinner?.start()
  try {
    await execFileAsync(
      'docker',
      ['stop', container]
    )
  } catch (_) {
    spinner?.fail()
    return false
  }

  spinner?.succeed()
  return true
}

export const removeContainer = async (
  container: string,
  spinner?: Ora
): Promise<boolean> => {
  spinner?.start()
  try {
    await execFileAsync(
      'docker',
      ['rm', container]
    )
  } catch (_) {
    spinner?.fail()
    return false
  }

  spinner?.succeed()
  return true
}
