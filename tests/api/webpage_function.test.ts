import { Request, Response } from 'express'

import * as wf from '../../src/api/webpage_function'
import { file_manager as fm } from '../../src/FileManager/FileManager'
import { AUTH_PW, RET_PW, get_admin_ip } from '../../src/config'
import { AFolder, RetFolder } from '../../src/FileManager/Folder'


jest.mock('../../src/constants', () => ({
  get ROOT_ASSET_PATH() { return './tests/test_files/test_asset' },
  get TEMP_PATH() { return './tests/test_files/test_temp' }
}))

jest.mock('../../src/config', () => ({
  get AUTH_PW() { return 'auth_pw' },
  get RET_PW() { return 'ret_pw' },
  get_admin_ip() { return 'admin_ip' }
}))


class fake_Folder extends AFolder {
  constructor() {
    super('fake folder', null)
  }
}
class fake_RetFolder extends RetFolder {
  constructor() {
    super(new fake_Folder())
  }
}


describe('test get directory files function', () => {
  const send_mock = jest.fn((data) => data)
  const send_status_mock = jest.fn((status) => status)
  const read_folder_mock = jest.spyOn(fm, 'read_folder').mockReturnValue([])

  const req : Partial<Request> = {
    query: { id: '0' }
  }
  const res : Partial<Response> = {
    send(data) {
      send_mock(data)
      return this
    },
    sendStatus(status) {
      send_status_mock(status)
      return this
    },
    end() {
      return this
    }
  }

  test('normal run', () => {
    wf.getFileInDir(req as Request, res as Response)
    expect(read_folder_mock).toHaveBeenCalledWith(0)
    expect(send_mock).toHaveBeenCalledWith(JSON.stringify([]))
  })

  test('error occured', () => {
    read_folder_mock.mockImplementation(() => { throw new Error() })
    wf.getFileInDir(req as Request, res as Response)
    expect(send_status_mock).toHaveBeenCalledWith(500)
  })
})

describe('test get admin password function', () => {
  const status_mock = jest.fn((status) => status)
  const send_mock = jest.fn((data) => data)

  const res : Partial<Response> = {
    status(status) {
      status_mock(status)
      return this
    },
    send(data) {
      send_mock(data)
      return this
    }
  }

  test('auth pw correct', () => {
    const req : Partial<Request> = {
      query: { pw: AUTH_PW }
    }
    wf.getAdminPass(req as Request, res as Response)
    expect(status_mock).toHaveBeenCalledWith(200)
    expect(send_mock).toHaveBeenCalledWith({ admin_pass: RET_PW })
  })

  test('wrong auth pw', () => {
    const req : Partial<Request> = {
      query: { pw: AUTH_PW+'.' }
    }
    wf.getAdminPass(req as Request, res as Response)
    expect(status_mock).toHaveBeenCalledWith(200)
    expect(send_mock).toHaveBeenCalledWith({ admin_pass: false })
  })
})

describe('test check_admin_pass', () => {
  const send_mock = jest.fn()
  const res : Partial<Response> = {
    status(status) {
      return this
    },
    send(data) {
      send_mock(data)
      return this
    }
  }

  test('correct admin pw', () => {
    const req : Partial<Request> = {
      query: { pw: AUTH_PW }
    }
    wf.checkAdminPass(req as Request, res as Response)
    expect(send_mock).toHaveBeenCalledWith(true)
  })

  test('wrong admin pw', () => {
    const req : Partial<Request> = {
      query: { pw: AUTH_PW+'.' }
    }
    wf.checkAdminPass(req as Request, res as Response)
    expect(send_mock).toHaveBeenCalledWith(false)
  })
})

describe('test check admin function', () => {
  const send_mock = jest.fn((data) => data)

  const res : Partial<Response> = {
    status(status) {
      return this
    },
    send(data) {
      send_mock(data)
      return this
    }
  }

  beforeEach(() => {
    send_mock.mockClear()
  })

  test('is admin ip', () => {
    const req : Partial<Request> = {
      ip: get_admin_ip()
    }
    wf.checkAdmin(req as Request, res as Response)
    expect(send_mock).toHaveBeenCalledWith(true)
  })

  test('not admin ip', () => {
    const req : Partial<Request> = {
      ip: 'not' + get_admin_ip()
    }
    wf.checkAdmin(req as Request, res as Response)
    expect(send_mock).toHaveBeenCalledWith(false)
  })
})

describe('test get folder info function', () => {
  const fake_ret_folder = new fake_RetFolder()

  const send_mock = jest.fn((data) => data)
  const send_status_mock = jest.fn((status) => status)
  const get_folder_info_mock = jest.spyOn(fm, 'get_folder_info').mockReturnValue(fake_ret_folder)

  const req : Partial<Request> = {
    query: { id: '0' }
  }
  const res : Partial<Response> = {
    send(data) {
      send_mock(data)
      return this
    },
    sendStatus(status) {
      send_status_mock(status)
      return this
    },
    end() {
      return this
    }
  }

  test('normal run', () => {
    wf.getFolderInfo(req as Request, res as Response)
    expect(get_folder_info_mock).toHaveBeenCalledWith(0)
    expect(send_mock).toHaveBeenCalledWith(JSON.stringify(fake_ret_folder))
  })

  test('error occured', () => {
    get_folder_info_mock.mockImplementation(() => { throw new Error() })
    wf.getFolderInfo(req as Request, res as Response)
    expect(send_status_mock).toHaveBeenCalledWith(500)
  })
})
