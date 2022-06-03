import { execFile } from 'child_process'
import { promisify } from 'util'

interface ConsoleOutput{
  stdout: string
  stderr: string
}
const execFileAsync = promisify(execFile)

export const runContainer = async (
  image: string,
  workingPath: string
): Promise<string> => {
  const result = await execFileAsync(
    'docker',
    ['run', '-id', '-v', workingPath + ':/app', '-w', '/app', image]
  )
  return result.stdout.trim()
}

export const execOnContainer = async (
  container: string,
  command: string
): Promise<ConsoleOutput> => {
  return await execFileAsync(
    'docker',
    ['exec', container, ...command.split(' ')]
  )
}

export const stopContainer = async (
  container: string
): Promise<ConsoleOutput> => {
  return await execFileAsync(
    'docker',
    ['stop', container]
  )
}

export const removeContainer = async (
  container: string
): Promise<ConsoleOutput> => {
  return await execFileAsync(
    'docker',
    ['rm', container]
  )
}
