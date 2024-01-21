import { IncomingForm } from 'formidable'
import { Request, Response } from 'express'
import { file_manager as fm } from '../FileManager/FileManager'
import { log, log_err } from '../logger'
import { ws_service } from '../ws/file_list_ws'
import { RetFolder } from '../FileManager/Folder'
import { TEMP_PATH } from '../constants'

export function downloadFile(req : Request, res : Response) {
  try {
    const id = parseInt(req.query.id as string)
    const file_path = fm.get_file_path(id)

    // lock file when download
    fm.add_file_lock(id)
    req.on('close', () => { fm.release_file_lock(id) })

    res.download(file_path)
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function uploadFile(req : Request, res : Response) {
  const form = new IncomingForm({
    multiples: true,
    uploadDir: TEMP_PATH,
    maxFileSize: 6 * 1024 * 1024 * 1024 * 8
  })

  form.on('aborted', () => {
    log(`The upload from ${req.ip} is aborted`)
  })

  form.parse(req, (err, fields, files) => {
    if(err) {
      // if upload is not aborted
      if (err.code != 1002)
        log_err(err)
      return
    }

    try {
      const folder_id = parseInt(fields.folder_id[0])
      const file_nm = fm.store_temp_file(files.file[0], folder_id)
      ws_service.broadcast(folder_id)
      res.status(200).send({ file_nm })
    } catch(e) {
      log_err(e)
      res.sendStatus(500).end()
    }
  })
}

export function deleteFileObj(req : Request, res : Response) {
  try {
    const obj_id = parseInt(req.query.id as string)
    const folder_id = fm.get_folder_id(obj_id)
    fm.delete_obj(obj_id)
    ws_service.broadcast(folder_id)
    res.sendStatus(200).end()
  } catch(e) {
    log_err(e)
    res.sendStatus(500).end()
  }
}

export function addFolder (req : Request, res : Response) {
  try {
    const id : number = parseInt(String(req.query.id)) // id of the parent folder
    const name : string = String(req.query.name) // name of the new folder
    const folder : RetFolder = fm.add_folder(id, name)
    ws_service.broadcast(id)
    res.send(JSON.stringify(folder))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function checkFileObjLock (req : Request, res : Response) {
  try {
    const id = parseInt(String(req.query.id))
    const is_lock = fm.check_lock(id)
    res.send(JSON.stringify(is_lock))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}
