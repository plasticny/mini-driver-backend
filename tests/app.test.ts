import { Server } from 'http'
import supertest from 'supertest'
import superwstest from 'superwstest'
import { Request, Response, NextFunction } from 'express'

import App from '../src/app'
import * as Auth from '../src/auth'
import * as Logger from '../src/logger'
import * as FileApi from '../src/api/file_operation'
import * as WebpageApi from '../src/api/webpage_function'
import { ws_service } from '../src/ws/file_list_ws'


jest.mock('../src/ws/file_list_ws', () => ({
  ws_service: {
    request_handler: jest.fn()
  }
}))


class test_app extends App {
  public _get_env () : string {
    return super._get_env()
  }
  public _set_prod_env () : void {
    super._set_prod_env()
  }
  public _set_dev_env () : void {
    super._set_dev_env()
  }
  public _start_listen(): Server {
    return super._start_listen()
  }
}


/* === helper function === */
function jest_fn_res(req:Request, res:Response) {
  res.status(200).send('ok').end()
}
function jest_fn_next(req:Request, res:Response, next:NextFunction) {
  next()
}
function close_server(server:Server) : Promise<void> {
  return new Promise(resolve => {
    server.close(() => { resolve() })
  })
}
/* === helper function === */


describe('test start app', () => {
  test('set environment correctly', () => {
    const app = new test_app()

    jest.spyOn(app, '_start_listen').mockImplementation(jest.fn())
    const get_env_mock = jest.spyOn(app, '_get_env')
    const set_prod_env_mock = jest.spyOn(app, '_set_prod_env')
    const set_dev_env_mock = jest.spyOn(app, '_set_dev_env')

    // test production environment
    get_env_mock.mockReturnValue('production')
    app.start()
    expect(set_prod_env_mock).toHaveBeenCalledTimes(1)
    expect(set_dev_env_mock).toHaveBeenCalledTimes(0)

    // test development environment
    get_env_mock.mockReturnValue('development')
    set_prod_env_mock.mockReset()
    app.start()
    expect(set_prod_env_mock).toHaveBeenCalledTimes(0)
    expect(set_dev_env_mock).toHaveBeenCalledTimes(1)
  })
})

describe('test routering', () => {
  const logger_mock = jest.spyOn(Logger, 'log').mockImplementation(jest.fn())
  const whitelist_mock = jest.spyOn(Auth, 'whitelist').mockImplementation(jest_fn_next)
  const admin_mock = jest.spyOn(Auth, 'admin').mockImplementation(jest_fn_next)
  let server : Server

  afterEach(async function () {
    logger_mock.mockClear()
    whitelist_mock.mockClear()
    await close_server(server)
  })

  test('file api', async function () {
    const upload_file_mock = jest.spyOn(FileApi, 'uploadFile').mockImplementation(jest_fn_res)
    const download_file_mock = jest.spyOn(FileApi, 'downloadFile').mockImplementation(jest_fn_res)
    const delete_file_obj_mock = jest.spyOn(FileApi, 'deleteFileObj').mockImplementation(jest_fn_res)
    const add_folder_mock = jest.spyOn(FileApi, 'addFolder').mockImplementation(jest_fn_res)
    const check_file_obj_lock_mock = jest.spyOn(FileApi, 'checkFileObjLock').mockImplementation(jest_fn_res)

    const app = new test_app()
    server = app.start()

    await supertest(app.app).post('/f/uploadFile')
    expect(upload_file_mock).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(1)
    expect(logger_mock).toHaveBeenCalledTimes(1)
    
    await supertest(app.app).get('/f/downloadFile')
    expect(download_file_mock).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(2)
    expect(logger_mock).toHaveBeenCalledTimes(2)

    await supertest(app.app).get('/f/deleteFileObj')
    expect(delete_file_obj_mock).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(3)
    expect(logger_mock).toHaveBeenCalledTimes(3)
    expect(admin_mock).toHaveBeenCalledTimes(1)

    await supertest(app.app).get('/f/addFolder')
    expect(add_folder_mock).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(4)
    expect(logger_mock).toHaveBeenCalledTimes(4)
    expect(admin_mock).toHaveBeenCalledTimes(2)

    await supertest(app.app).get('/f/checkFileObjLock')
    expect(check_file_obj_lock_mock).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(5)
    expect(logger_mock).toHaveBeenCalledTimes(5)
  })

  test('webpage api', async function () {
    const get_file_in_dir_mock = jest.spyOn(WebpageApi, 'getFileInDir').mockImplementation(jest_fn_res)
    const get_admin_pass_mock = jest.spyOn(WebpageApi, 'getAdminPass').mockImplementation(jest_fn_res)
    const check_admin_pass_mock = jest.spyOn(WebpageApi, 'checkAdminPass').mockImplementation(jest_fn_res)
    const check_admin_mock = jest.spyOn(WebpageApi, 'checkAdmin').mockImplementation(jest_fn_res)
    const get_server_qr_url_mock = jest.spyOn(WebpageApi, 'getServerQrUrl').mockImplementation(jest_fn_res)
    const get_folder_info_mock = jest.spyOn(WebpageApi, 'getFolderInfo').mockImplementation(jest_fn_res)

    const app = new test_app()
    server = app.start()

    await supertest(app.app).get('/w/getFileInDir')
    expect(get_file_in_dir_mock).toHaveBeenCalledTimes(1)
    
    await supertest(app.app).get('/w/getAdminPass')
    expect(get_admin_pass_mock).toHaveBeenCalledTimes(1)

    await supertest(app.app).get('/w/checkAdminPass')
    expect(check_admin_pass_mock).toHaveBeenCalledTimes(1)

    await supertest(app.app).get('/w/checkAdmin')
    expect(check_admin_mock).toHaveBeenCalledTimes(1)

    await supertest(app.app).get('/w/getServerQrUrl')
    expect(get_server_qr_url_mock).toHaveBeenCalledTimes(1)

    await supertest(app.app).get('/w/getFolderInfo')
    expect(get_folder_info_mock).toHaveBeenCalledTimes(1)

    expect(whitelist_mock).toHaveBeenCalledTimes(6)
    expect(logger_mock).toHaveBeenCalledTimes(6)
  })

  test('websocket', async function () {
    const request_handler_spy = jest.spyOn(ws_service, 'request_handler')

    const app = new test_app()
    server = app.start()

    await superwstest(server).ws('/ws/fileList')

    expect(request_handler_spy).toHaveBeenCalledTimes(1)
    expect(whitelist_mock).toHaveBeenCalledTimes(1)
    expect(logger_mock).toHaveBeenCalledTimes(1)
  })
})

describe('test whitelist working', () => {
  let server : Server;

  test('block access', async function () {
    const whitelist_mock = jest.spyOn(Auth, 'whitelist')
    whitelist_mock.mockImplementation((req, res, next) => { res.status(403).end() })

    const app = new test_app()
    server = app.start()

    await supertest(app.app)
      .get('/w/getFileInDir')
      .expect(403)

    expect(whitelist_mock).toHaveBeenCalledTimes(1)
  })

  afterEach(async function () {
    await close_server(server)
  })
})