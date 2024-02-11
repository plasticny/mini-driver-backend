import WebSocket from 'ws'
import { Request } from 'express'

import { log } from '../logger'
import { file_manager as fm } from '../FileManager/FileManager'

/* === data types === */
export type WSType = {
  ws : WebSocket,
  folder_id : number
}
export type ReceiveMsgType = {
  action : string,
  id : number
}

export class WsService {
  // map of websocket connections with folder id
  // if the entry with key '1' has value [ws1, ws2],
  // it means that ws1 and ws2 are listening to any updating of folder 1
  protected __ws_map : Map<number, Set<WebSocket>>

  constructor () {
    this.__ws_map = new Map()
  }

  protected __get_folder_ws_set (folder_id : number) : Set<WebSocket> {
    if (!this.__ws_map.has(folder_id))
      throw new Error(`folder ${folder_id} not found`)
    return this.__ws_map.get(folder_id)
  }

  protected __add_ws(ws_data : WSType) {
    if (!this.__ws_map.has(ws_data.folder_id))
      this.__ws_map.set(ws_data.folder_id, new Set())
    this.__ws_map.get(ws_data.folder_id).add(ws_data.ws)
  }

  protected __remove_ws(ws_data : WSType) {
    const ws_set = this.__get_folder_ws_set(ws_data.folder_id)
    ws_set.delete(ws_data.ws)

    if (ws_set.size === 0)
      this.__ws_map.delete(ws_data.folder_id)
  }

  /* change the listening folder of `ws` to the folder with `target_id` */
  protected __ws_change_folder (ws_data : WSType, target_id : number) {
    if (!this.__get_folder_ws_set(ws_data.folder_id).has(ws_data.ws)) {
      throw new Error(`the ws instance not found in folder ${ws_data.folder_id}`)
    }

    this.__remove_ws(ws_data)
    
    // move to new folder in the map
    ws_data.folder_id = target_id
    this.__add_ws(ws_data)

    // update ws's file list
    ws_data.ws.send(JSON.stringify(fm.read_folder(target_id)))
  }

  /* ====== Request Handler ====== */
  /* handle a ws request from client */
  public request_handler (ws: WebSocket, req: Request) {
    log(`WS ${req.ip} ${decodeURI(req.url)}`)
  
    // store ws
    const ws_data : WSType = { ws, folder_id: parseInt(String(req.query.id)) }
    this.__add_ws(ws_data)

    ws
      // event handlers
      .on('message', function (msg : string) {
        log(`WS ${req.ip} ${decodeURI(req.url)} ${msg}`)
        this.__on_ws_message(ws_data, msg)
      }.bind(this))
      .on('close', function () { this.__remove_ws(ws_data) }.bind(this))
      // send file list
      .send(JSON.stringify(fm.read_folder(ws_data.folder_id)))
  }

  protected __on_ws_message (ws_data: WSType, msg : string) {
    const data : ReceiveMsgType = JSON.parse(msg)
    
    if (data.action === 'change_folder') {
      this.__ws_change_folder(ws_data, parseInt(String(data.id)))
    }
  }
  /* ====== Request Handler ====== */

  public broadcast(folder_id : number) {
    const ws_set = this.__get_folder_ws_set(folder_id)
  
    log(`WS broadcast folder ${folder_id}`)
  
    const msg = JSON.stringify(fm.read_folder(folder_id))
    ws_set.forEach((ws) => {
      ws.send(msg)
    })
  }
}
export const ws_service = new WsService()

export function ws_request_handler (ws: WebSocket, req: Request) {
  // if directly call ws_service's request_handler in the router,
  // `this` will somehow be undefined in the request_handler
  // so use a wrapper function to call ws_service's request_handler
  ws_service.request_handler(ws, req)
}