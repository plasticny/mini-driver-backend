import { existsSync, rmSync, readFileSync } from 'fs'

const LOG_FOLDER_PATH_MOCK = jest.fn(() => './tests/test_files/test_log')
const LOG_FILE_PATH_MOCK = jest.fn(() => './tests/test_files/test_log/log.txt')
jest.mock('../src/constants', () => ({
  get LOG_FOLDER_PATH() { return LOG_FOLDER_PATH_MOCK() },
  get LOG_FILE_PATH() { return LOG_FILE_PATH_MOCK() }
}))


beforeAll(() => {
  if (existsSync(LOG_FOLDER_PATH_MOCK())) {
    rmSync(LOG_FOLDER_PATH_MOCK(), { recursive: true })
  }
})

import { log, log_err, init } from '../src/logger'
describe('testing logger', () => {
  test('init', () => {
    init()
    expect(existsSync(LOG_FOLDER_PATH_MOCK())).toBe(true)
    expect(existsSync(LOG_FILE_PATH_MOCK())).toBe(true)
  })

  test('log', () => {
    log('test log')
    const log_content = readFileSync(LOG_FILE_PATH_MOCK()).toString()
    expect(log_content).toMatch(/\[.*\] test log\n/)
  })

  test('log_err', () => {
    log_err('test log_err')
    const log_content = readFileSync(LOG_FILE_PATH_MOCK()).toString()
    expect(log_content).toMatch(/ERROR \[.*\] test log_err\n/)
  })
})