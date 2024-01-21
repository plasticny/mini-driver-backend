let is_enabled = false
jest.mock('../src/config', () => ({
  get WHITELIST_ENABELED() { return is_enabled },
  get WHITELIST_IP() { return new Set(['::ffff:111.111.111.111']) },
  get localhost() { return '::ffff:' }, 
  get RET_PW() { return 'test_pw' },
  get_admin_ip() { return '::ffff:222.222.222.222' }
}))


import { Request, Response } from 'express'

import { whitelist, admin } from '../src/auth'
import { get_admin_ip, localhost, RET_PW } from '../src/config'


describe('test whitelist', () => {
  test('when whitelist disabled', () => {
    is_enabled = false

    const next_mock = jest.fn()

    const req : Partial<Request> = {}
    const res : Partial<Response> = {}

    whitelist(req as Request, res as Response, next_mock)
    
    expect(next_mock).toHaveBeenCalledTimes(1)
  })

  test('when ip not in whitelist', () => {
    is_enabled = true

    const next_mock = jest.fn()
    const send_mock = jest.fn((msg) => {})
    const status_mock = jest.fn((code) => {})

    const req : Partial<Request> = {
      ip: '::ffff:000.000.000.000',
      url: 'test_url'
    }
    const res : Partial<Response> = {
      status(code) {
        status_mock(code)
        return this
      },
      send(body) {
        send_mock(body)
        return this
      },
      end() {
        return this
      }
    }

    whitelist(req as Request, res as Response, next_mock)

    expect(status_mock).toHaveBeenNthCalledWith(1, 403)
    expect(send_mock).toHaveBeenCalledTimes(1)
    expect(next_mock).toHaveBeenCalledTimes(0)
  })

  test('when ip in whitelist', () => {
    is_enabled = true

    const next_mock = jest.fn()

    const req : Partial<Request> = {
      ip: '::ffff:111.111.111.111',
      url: 'test_url'
    }
    const res : Partial<Response> = {}

    whitelist(req as Request, res as Response, next_mock)

    expect(next_mock).toHaveBeenCalledTimes(1)
  })
})

describe('test admin', () => {
  test('authorized when ip is admin', () => {
    const next_mock = jest.fn()

    const req : Partial<Request> = {
      ip: get_admin_ip(),
      query: {}
    }

    admin(req as Request, {} as Response, next_mock)

    expect(next_mock).toHaveBeenCalledTimes(1)
  })
  test('authorized when ip is localhost', () => {
    const next_mock = jest.fn()

    const req : Partial<Request> = {
      ip: localhost,
      query: {}
    }

    admin(req as Request, {} as Response, next_mock)

    expect(next_mock).toHaveBeenCalledTimes(1)
  })

  test('authorized when pw is correct', () => {
    const next_mock = jest.fn()

    const req : Partial<Request> = {
      ip: 'test_ip',
      query: { pw: RET_PW }
    }

    admin(req as Request, {} as Response, next_mock)

    expect(next_mock).toHaveBeenCalledTimes(1)
  })

  test('unauthorized admin access', () => {
    const next_mock = jest.fn()
    const send_status_mock = jest.fn((code) => {})

    const req : Partial<Request> = {
      ip: 'test_ip',
      query: {}
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        send_status_mock(code)
        return this
      },
      end() {
        return this
      }
    }

    admin(req as Request, res as Response, next_mock)

    expect(send_status_mock).toHaveBeenNthCalledWith(1, 401)
    expect(next_mock).toHaveBeenCalledTimes(0)
  })
})
