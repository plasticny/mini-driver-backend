import express from 'express'
import expressWs from 'express-ws'
import cors from 'cors'
import { Server } from 'http'

import { PORT }  from './config'
import { log } from './logger'
import * as Auth from './auth'

import * as file_api from './api/file_operation'
import * as webpage_api from './api/webpage_function'
import { ws_request_handler } from './ws/file_list_ws'

export default class {
  app : expressWs.Application

  constructor() {
    this.app = expressWs(express()).app 
  }

  public start() : Server {  
    const env = this._get_env()
    console.log('env:', env)
    // webpage static for production
    if (env === 'production') {
      this._set_prod_env()
    }
    // cors for development
    else if (env === 'development') {
      this._set_dev_env()
    }
  
    this.app
      // logger and whitelist
      .use('', Auth.whitelist)
      .use('', (req, res, next) => {
        log(`${req.ip} ${decodeURI(req.url)}`)
        next()
      })
  
      // router for file operation api
      .use('/f', express.Router()
        .post('/uploadFile',      file_api.uploadFile)
        .get('/downloadFile',     file_api.downloadFile)
        .get('/deleteFileObj',    Auth.admin, file_api.deleteFileObj)
        .get('/addFolder',        Auth.admin, file_api.addFolder)
        .get('/checkFileObjLock', file_api.checkFileObjLock)
      )
  
      // router for webpage function api
      .use('/w', express.Router()
        .get('/getFileInDir',   webpage_api.getFileInDir)
        .get('/getAdminPass',   webpage_api.getAdminPass)
        .get('/checkAdminPass', webpage_api.checkAdminPass)
        .get('/checkAdmin',     webpage_api.checkAdmin)
        .get('/getServerQrUrl', webpage_api.getServerQrUrl)
        .get('/getFolderInfo',  webpage_api.getFolderInfo)
      )
  
      // websocket for update client file list
      .ws('/ws/fileList', ws_request_handler)
  
    return this._start_listen()
  }

  protected _get_env() : string {
    return process.env.NODE_ENV || 'development'
  }
  
  protected _set_prod_env() {
    this.app
      .use(express.static('frontend_dist'))
      .use('/', express.Router()
        .get('', (_, res) => {
          res.render('index') 
        })
      )
  }
  
  protected _set_dev_env() {
    this.app
      .use(cors({
        origin:['http://localhost:8080'],
        methods:['GET','POST'],
      }))
      .all('*', (_, res, next) => {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Access-Control-Allow-Headers', '*')
        res.header('Access-Control-Allow-Methods', '*')
        next()
      })
  }

  protected _start_listen() : Server {
    return this.app.listen(PORT, () => {
      console.log(`Mini driver backend listening at http://localhost:${PORT}`)
    })
  }
}
