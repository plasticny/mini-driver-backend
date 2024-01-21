import { Request, Response } from 'express'
import formidable from 'formidable'

import * as fo from '../../src/api/file_operation'
import { ws_service } from '../../src/ws/file_list_ws'
import { file_manager as fm } from '../../src/FileManager/FileManager'
import { File } from '../../src/FileManager/File'
import { AFolder, RetFolder } from '../../src/FileManager/Folder'

import { prepare_test_asset } from '../test_helper'


jest.mock('../../src/logger', () => ({
  log(msg:string) { console.log(msg) },
  log_err: jest.fn((err) => { console.log(err)}),
  init() {}
}))

jest.mock('../../src/constants', () => ({
  get ROOT_ASSET_PATH() { return './tests/test_files/test_asset' },
  get TEMP_PATH() { return './tests/test_files/test_temp' }
}))

// mock IncomingForm
jest.mock('formidable', () => ({
  IncomingForm: jest.fn(() => {})
}))
type ErrorType = { code: number }
type FieldsType = { folder_id: Array<string> }
type FilesType = { file: Array<test_File> }
class fake_IncomingForm {
  static cb_params_ls : Array<{
    error: ErrorType | null,
    fields: FieldsType,
    files: FilesType
  }> = []

  public parse(req : Request, cb : (err:ErrorType | null, fields:FieldsType, files:FilesType) => void) {
    fake_IncomingForm.cb_params_ls.forEach((params) => {
      cb(params.error, params.fields, params.files)
    })
  }
  public on() {}
}
formidable.IncomingForm = fake_IncomingForm as any

jest.mock('../../src/ws/file_list_ws', () => ({
  ws_service: {
    broadcast: jest.fn((folder_id) => {})
  }
}))


class fake_Folder extends AFolder {
  constructor() {
    super('test folder', null)
  }
}
class fake_RetFolder extends RetFolder {
  constructor(id:number, name:string) {
    super(new fake_Folder())
    this._id = id
    this._name = name
  }
}
class test_File extends File {
  constructor() {
    super('test file', new fake_Folder())
  }
}


let file_id_ls : Array<number> = []
let folder_id_ls : Array<number> = []
beforeAll(() => {
  prepare_test_asset()
  for (const ret_obj of fm.read_folder(0)) {
    const json = ret_obj.toJSON()
    if (json['type'] === 'file') {
      file_id_ls.push(json['id'])
    } else {
      folder_id_ls.push(json['id'])
    }
  }
})

afterAll(prepare_test_asset)


describe('test download file function', () => {
  test('normal run', () => {
    const download_mock = jest.fn()
    
    let req_close_cd : (...args: any[]) => void = () => {}
    const req : Partial<Request> = {      
      query: { id: String(file_id_ls[0]) },
      on(event : string, cb : (...args: any[]) => void ) {
        if (event === 'close') {
          req_close_cd = cb
        }
        return this
      },
      emit(event : string, ...args: any[]) {
        if (event === 'close') {
          req_close_cd()
        }
        return this
      }
    }

    const res : Partial<Response> = {
      download(path : string) {
        download_mock(path)
      }
    }

    fo.downloadFile(req as Request, res as Response)

    expect(download_mock).toHaveBeenCalledTimes(1)
    expect(fm.check_lock(file_id_ls[0])).toBe(true)

    // simulate file download finished
    req.emit!('close')

    expect(fm.check_lock(file_id_ls[0])).toBe(false)
  })

  test('failed when no object has the id', () => {
    const status_mock = jest.fn((code) => {})

    const req : Partial<Request> = {
      query: { id: '999999' }
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        status_mock(code)
        return this
      },
      end () {
        return this
      }
    }

    fo.downloadFile(req as Request, res as Response)

    expect(status_mock).toHaveBeenNthCalledWith(1, 500)
  })

  test('failed when the object is a folder', () => {
    const status_mock = jest.fn((code) => {})

    const req : Partial<Request> = {
      query: { id: String(folder_id_ls[0]) }
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        status_mock(code)
        return this
      },
      end () {
        return this
      }
    }

    fo.downloadFile(req as Request, res as Response)

    expect(status_mock).toHaveBeenNthCalledWith(1, 500)
  })
})

describe('test upload file function', () => {
  const store_temp_file_mock = jest.spyOn(fm, 'store_temp_file')
  store_temp_file_mock.mockImplementation((file, folder_id) => { return 'name' })

  const broadcast = jest.spyOn(ws_service, 'broadcast')
  broadcast.mockImplementation((folder_id) => {})

  const send_status_mock = jest.fn((code) => {})

  const test_file_ls = [new test_File(), new test_File()]
  const res : Partial<Response> = {
    status(code) {
      return this
    },
    send(body) {
      return this
    },
    sendStatus(code) {
      send_status_mock(code)
      return this
    },
    end() {
      return this
    }
  }

  beforeEach(() => {
    store_temp_file_mock.mockClear()
    broadcast.mockClear()
    send_status_mock.mockClear()
  })

  test('normal run', () => {
    fake_IncomingForm.cb_params_ls = [
      {
        error: null,
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[0]] }
      },
      {
        error: null,
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[1]] }
      }
    ]

    fo.uploadFile({} as Request, res as Response)

    expect(store_temp_file_mock).toHaveBeenNthCalledWith(1, test_file_ls[0], folder_id_ls[0])
    expect(broadcast).toHaveBeenNthCalledWith(1, folder_id_ls[0])
    expect(store_temp_file_mock).toHaveBeenNthCalledWith(2, test_file_ls[1], folder_id_ls[0])
    expect(broadcast).toHaveBeenNthCalledWith(2, folder_id_ls[0])

    const store_temp_file_order = store_temp_file_mock.mock.invocationCallOrder
    const broadcast_order = broadcast.mock.invocationCallOrder

    expect(store_temp_file_order[0]).toBeLessThan(broadcast_order[0])
    expect(broadcast_order[0]).toBeLessThan(store_temp_file_order[1])
    expect(store_temp_file_order[1]).toBeLessThan(broadcast_order[1])
  })

  test('when error occur in parse', () => {
    fake_IncomingForm.cb_params_ls = [
      {
        error: { code: 1002 }, // aborted
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[0]] }
      },
      {
        error: { code: 1 },
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[1]] }
      }
    ]

    fo.uploadFile({} as Request, res as Response)

    expect(store_temp_file_mock).toHaveBeenCalledTimes(0)
    expect(broadcast).toHaveBeenCalledTimes(0)
  })

  test('when error occur in parse callback', () => {
    fake_IncomingForm.cb_params_ls = [
      {
        error: null,
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[0]] }
      },
      {
        error: null,
        fields: { folder_id: [String(folder_id_ls[0])] },
        files: { file: [test_file_ls[1]] }
      }
    ]

    store_temp_file_mock.mockImplementationOnce(() => { throw new Error() })
    fo.uploadFile({} as Request, res as Response)
    expect(send_status_mock).toHaveBeenCalledWith(500)
  })
})

describe('test delete object function', () => {
  let delete_obj_mock : jest.SpyInstance
  let boardcast_mock : jest.SpyInstance
  let status_mock : jest.Mock

  beforeAll(() => {
    delete_obj_mock = jest.spyOn(fm, 'delete_obj').mockImplementation((id) => {})
    boardcast_mock = jest.spyOn(ws_service, 'broadcast')
    status_mock = jest.fn((code) => {})
  })

  beforeEach(() => {
    delete_obj_mock.mockClear()
    boardcast_mock.mockClear()
    status_mock.mockClear()
  })

  test('normal run', () => {
    const req : Partial<Request> = {
      query: { id: String(file_id_ls[0]) }
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        status_mock(code)
        return this
      },
      end () {
        return this
      }
    }

    fo.deleteFileObj(req as Request, res as Response)

    expect(delete_obj_mock).toHaveBeenNthCalledWith(1, file_id_ls[0])
    expect(boardcast_mock).toHaveBeenNthCalledWith(1, fm.get_folder_id(file_id_ls[0]))
    expect(status_mock).toHaveBeenNthCalledWith(1, 200)
  })

  test('failed when no object has the id', () => {
    const req : Partial<Request> = {
      query: { id: '999999' }
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        status_mock(code)
        return this
      },
      end () {
        return this
      }
    }

    fo.deleteFileObj(req as Request, res as Response)

    expect(status_mock).toHaveBeenNthCalledWith(1, 500)
  })    
})

describe('test add folder function', () => {
  const fake_ret_folder = new fake_RetFolder(9999, 'test folder')

  let add_folder_mock : jest.SpyInstance
  let boardcast_mock : jest.SpyInstance
  let status_mock : jest.Mock

  beforeAll(() => {
    add_folder_mock = jest.spyOn(fm, 'add_folder').mockImplementation((id, name) => {
      return fake_ret_folder
    })
    boardcast_mock = jest.spyOn(ws_service, 'broadcast')
    status_mock = jest.fn((code) => {})
  })

  beforeEach(() => {
    add_folder_mock.mockClear()
    boardcast_mock.mockClear()
    status_mock.mockClear()
  })

  test('normal run', () => {
    const req : Partial<Request> = {
      query: { id: String(folder_id_ls[0]), name: 'test folder' }
    }
    const res : Partial<Response> = {
      send(body) {
        status_mock(body)
        return this
      }
    }

    fo.addFolder(req as Request, res as Response)

    expect(add_folder_mock).toHaveBeenNthCalledWith(1, folder_id_ls[0], 'test folder')
    expect(boardcast_mock).toHaveBeenNthCalledWith(1, folder_id_ls[0])

    expect(status_mock).toHaveBeenNthCalledWith(1, JSON.stringify(fake_ret_folder))
  })

  test('when error throw', () => {
    add_folder_mock.mockImplementation(() => { throw new Error() })

    const req : Partial<Request> = {
      query: { id: String(folder_id_ls[0]), name: 'test folder' }
    }
    const res : Partial<Response> = {
      sendStatus(body) {
        status_mock(body)
        return this
      },
      end() {
        return this
      }
    }

    fo.addFolder(req as Request, res as Response)
    expect(status_mock).toHaveBeenNthCalledWith(1, 500)
  })
})

describe('test check file object lock function', () => {
  test('normal run', () => {
    const send_mock = jest.fn((body) => {})

    const file_id = file_id_ls[0]
    const req : Partial<Request> = {
      query: { id: String(file_id) }
    }
    const res : Partial<Response> = {
      send(body) {
        send_mock(body)
        return this
      }
    }

    fo.checkFileObjLock(req as Request, res as Response)
    expect(send_mock).toHaveBeenLastCalledWith(JSON.stringify(false))
  })

  test('failed when no object has the id', () => {
    const status_mock = jest.fn((code) => {})

    const req : Partial<Request> = {
      query: { id: '999999' }
    }
    const res : Partial<Response> = {
      sendStatus(code) {
        status_mock(code)
        return this
      },
      end () {
        return this
      }
    }

    fo.checkFileObjLock(req as Request, res as Response)

    expect(status_mock).toHaveBeenNthCalledWith(1, 500)
  })
})
