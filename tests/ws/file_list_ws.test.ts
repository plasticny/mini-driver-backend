import WebSocket from 'ws'
import { Request } from 'express'

import * as WsService from '../../src/ws/file_list_ws'
import { file_manager as fm } from '../../src/FileManager/FileManager'


jest.mock('ws', () => (
  class {
    listeners : Map<string, (...args:any[]) => void>
    constructor(address:any) {
      this.listeners = new Map()
    }
    send(data:any) {}
    on(event:string, cb:(...args:any[]) => void) {
      this.listeners.set(event, cb)
      return this
    }
    emit(event:string, ...args:any[]) {
      if (!this.listeners.has(event)) {
        return
      }
      this.listeners.get(event)!(...args)
    }
  }
))

class test_WsService extends WsService.WsService {
  public get ws_map () { return this.__ws_map }
  public __get_folder_ws_set(folder_id: number): Set<WebSocket> {
    return super.__get_folder_ws_set(folder_id)
  }
  public __add_ws(ws_data: WsService.WSType): void {
    super.__add_ws(ws_data)   
  }
  public __remove_ws(ws_data: WsService.WSType): void {
    super.__remove_ws(ws_data)
  }
  public __ws_change_folder(ws_data: WsService.WSType, target_id: number): void {
    super.__ws_change_folder(ws_data, target_id)
  }
  public __on_ws_message(ws_data: WsService.WSType, msg: string): void {
    super.__on_ws_message(ws_data, msg)
  }
}


describe('test get folder ws set function', () => {
  const ws_service = new test_WsService()

  test('get non-exist folder', () => {
    expect(() => ws_service.__get_folder_ws_set(1)).toThrow(
      'folder 1 not found'
    )
  })

  test('get exist folder', () => {
    ws_service.ws_map.set(1, new Set())
    expect(ws_service.__get_folder_ws_set(1)).toBeInstanceOf(Set)
  })
})

describe('test add ws function', () => {
  const ws_service = new test_WsService()

  test('add first ws', () => {
    const ws = new WebSocket(null)
    ws_service.__add_ws({ ws, folder_id: 1 })
    expect(ws_service.ws_map.size).toBe(1)
    expect(ws_service.ws_map.get(1)!.size).toBe(1)
    expect(ws_service.ws_map.get(1)!.has(ws)).toBe(true)
  })

  test('add ws with same folder of first one', () => {
    const ws = new WebSocket(null)
    ws_service.__add_ws({ ws, folder_id: 1 })
    expect(ws_service.ws_map.size).toBe(1)
    expect(ws_service.ws_map.get(1)!.size).toBe(2)
    expect(ws_service.ws_map.get(1)!.has(ws)).toBe(true)
  })

  test('add ws with different folder of first one', () => {
    const ws = new WebSocket(null)
    ws_service.__add_ws({ ws, folder_id: 2 })
    expect(ws_service.ws_map.size).toBe(2)
    expect(ws_service.ws_map.get(2)!.size).toBe(1)
    expect(ws_service.ws_map.get(2)!.has(ws)).toBe(true)
  })
})

describe('test remove ws function', () => {
  const ws_service = new test_WsService()

  test('remove ws from non-exist folder', () => {
    expect(() => ws_service.__remove_ws({
      ws: new WebSocket(null),
      folder_id: 1
    })).toThrow(
      'folder 1 not found'
    )
  })

  test('remove ws', () => {
    const ws = new WebSocket(null)
    ws_service.__add_ws({ ws, folder_id: 1 })
    ws_service.__remove_ws({ ws, folder_id: 1 })
    expect(ws_service.ws_map.size).toBe(0)
  })
})

describe('test change folder function', () => {
  const fm_read_folder_mock = jest.spyOn(fm, 'read_folder')
  const send_mock = jest.fn()

  const ws_service = new test_WsService()
  const ws1 = new WebSocket(null)
  const ws2 = new WebSocket(null)
  const ws_data1 = { ws: ws1, folder_id: 1 }
  const ws_data2 = { ws: ws2, folder_id: 2 }

  beforeAll(() => {
    ws_service.__add_ws(ws_data1)
    ws_service.__add_ws(ws_data2)
  })
  beforeEach(() => {
    fm_read_folder_mock.mockClear()
  })

  test('change ws1 to listen folder 2', () => {
    const fm_read_folder_ret = []

    ws1.send = send_mock
    fm_read_folder_mock.mockReturnValue(fm_read_folder_ret)

    ws_service.__ws_change_folder(ws_data1, 2)

    expect(ws_service.ws_map.has(1)).toBe(false)
    expect(ws_service.ws_map.get(2)!.size).toBe(2)
    expect(ws_service.ws_map.get(2)!.has(ws1)).toBe(true)
    expect(fm_read_folder_mock).toHaveBeenCalledWith(2)
    expect(send_mock).toHaveBeenCalledWith(JSON.stringify(fm_read_folder_ret))
  })

  test('move from a non-exist folder', () => {
    const fake_ws_data = { ws: new WebSocket(null), folder_id: 3 }
    expect(() => ws_service.__ws_change_folder(fake_ws_data, 1)).toThrow(
      'folder 3 not found'
    )
    expect(ws_service.ws_map.has(1)).toBe(false)
  })

  test('move a non-exist ws', () => {
    const fake_ws_data = { ws: new WebSocket(null), folder_id: 2 }
    expect(() => ws_service.__ws_change_folder(fake_ws_data, 1)).toThrow(
      'the ws instance not found in folder 2'
    )
    expect(ws_service.ws_map.has(1)).toBe(false)
  })
})

describe('test request handler', () => {
  const ws_service = new test_WsService()
  const ws_on_ws_message_mock = jest.spyOn(ws_service, '__on_ws_message').mockImplementation()
  const ws_remove_ws_mock = jest.spyOn(ws_service, '__remove_ws').mockImplementation()

  const fm_read_folder_mock = jest.spyOn(fm, 'read_folder')
  const send_mock = jest.fn()

  it('pass the test', () => {
    const read_folder_ret = []
    fm_read_folder_mock.mockReturnValue(read_folder_ret)

    const ws = new WebSocket(null)
    ws.send = send_mock

    const req : Partial<Request> = {
      url: 'url',
      ip: 'ip',
      query: { id: '1' }
    }

    ws_service.request_handler(ws, req as Request)
    expect(ws_service.ws_map.size).toBe(1)
    expect(ws_service.ws_map.get(1)!.size).toBe(1)
    expect(ws_service.ws_map.get(1)!.has(ws)).toBe(true)
    expect(send_mock).toHaveBeenCalledWith(JSON.stringify(read_folder_ret))

    ws.emit('message', 'message')
    expect(ws_on_ws_message_mock).toHaveBeenCalledWith(
      { ws, folder_id: 1 }, 'message'
    )

    ws.emit('close')
    expect(ws_remove_ws_mock).toHaveBeenCalledWith({ ws, folder_id: 1 })
  })
})

describe('test ws on message event handler', () => {
  const ws_service = new test_WsService()
  const ws_change_folder_mock = jest.spyOn(ws_service, '__ws_change_folder').mockImplementation()

  test('route to ws_change_folder when action is change_folder', () => {
    const ws_data = { ws: new WebSocket(null), folder_id: 1 }
    ws_service.__on_ws_message(ws_data, JSON.stringify({
      action: 'change_folder',
      id: 2
    }))
    expect(ws_change_folder_mock).toHaveBeenCalledWith(ws_data, 2)
  })
})

describe('test broadcast function', () => {
  const ws_service = new test_WsService()
  const fm_read_folder_mock = jest.spyOn(fm, 'read_folder')

  const ws1 = new WebSocket(null)
  const ws2 = new WebSocket(null)
  const ws3 = new WebSocket(null)
  const ws_data1 = { ws: ws1, folder_id: 1 }
  const ws_data2 = { ws: ws2, folder_id: 1 }
  const ws_data3 = { ws: ws3, folder_id: 2 }

  beforeAll(() => {
    ws_service.__add_ws(ws_data1)
    ws_service.__add_ws(ws_data2)
    ws_service.__add_ws(ws_data3)
  })
  beforeEach(() => {
    fm_read_folder_mock.mockClear()
  })

  test('broadcast to non-exist folder', () => {
    expect(() => ws_service.broadcast(3)).toThrow(
      'folder 3 not found'
    )
  })

  test('broadcast to exist folder', () => {
    const fm_read_folder_ret = []
    fm_read_folder_mock.mockReturnValue(fm_read_folder_ret)

    const ws1_send_mock = jest.spyOn(ws1, 'send')
    const ws2_send_mock = jest.spyOn(ws2, 'send')

    ws_service.broadcast(1)

    expect(fm_read_folder_mock).toHaveBeenCalledWith(1)
    expect(ws1_send_mock).toHaveBeenCalledWith(JSON.stringify(fm_read_folder_ret))
    expect(ws2_send_mock).toHaveBeenCalledWith(JSON.stringify(fm_read_folder_ret))
  })
})
