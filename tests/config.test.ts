import { WHITELIST_IP, WHITELIST_ENABELED } from '../src/config'

const fake_admin_ip = '::ffff:111.111.111.111'
jest.mock('https', () => ({
  get: (url: string, callback: (res: any) => void) => {
    callback({
      on: (event: string, callback: (data: string) => void) => {
        if (event === 'data') {
          callback('111.111.111.111')
        }
      }
    })
    return {
      on: (event: string, callback: (e: any) => void) => {}
    }
  }
}))

describe('testing config', () => {
  test('white list only contains localhost and admin ip', () => {
    expect(WHITELIST_IP.size).toBe(2)
    expect(WHITELIST_IP.has('::1')).toBe(true)
    expect(WHITELIST_IP.has(fake_admin_ip)).toBe(true)
  })

  test('white list is enabled', () => {
    expect(WHITELIST_ENABELED).toBe(true)
  })
})