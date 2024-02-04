import { Request, Response } from 'express'
import { file_manager as fm } from '../FileManager/FileManager'
import { lookup as dns_lookup } from 'dns'
import { hostname } from 'os'
import { PORT, AUTH_PW, RET_PW, get_admin_ip } from '../config'
import { toDataURL as qr_data_url } from 'qrcode'

export function getFileInDir(req : Request, res : Response) {
  try {
    const id = String(req.query.id || 0) // get root folder if id is not given
    const file_ls = fm.read_folder(parseInt(id))
    res.send(JSON.stringify(file_ls))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function getAdminPass(req : Request, res : Response) {
  res.status(200).send({ admin_pass: req.query.pw == AUTH_PW ? RET_PW : false })
}
export function checkAdminPass(req : Request, res : Response) {
  res.status(200).send(req.query.pw == AUTH_PW)
}

/* check if the request ip is admin's ip */
export function checkAdmin(req : Request, res : Response) {
  res.status(200).send(req.ip == get_admin_ip())
}

export function getServerQrUrl(req : Request, res : Response) {
  try {
    dns_lookup(hostname(), (err, addr) => {
      if (err) { throw err }
      qr_data_url(`http://${addr}:${PORT}`, (err, url) => {
        if (err) { throw err }
        res.status(200).send({ url })
      })
    })
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}

export function getFolderInfo (req : Request, res : Response) {
  try {
    const id : string = String(req.query.id) // get root folder if id is not given
    const info = fm.get_folder_info(parseInt(id))
    res.send(JSON.stringify(info))
  } catch(e) {
    console.log(e)
    res.sendStatus(500).end()
  }
}
