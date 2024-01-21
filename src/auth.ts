import { Request, Response, NextFunction } from 'express'
import { WHITELIST_ENABELED, WHITELIST_IP, get_admin_ip, localhost, RET_PW } from './config'
import { log } from './logger'

export function whitelist (req:Request, res:Response, next:NextFunction) {
  // check if the request ip is in the whitelist
  if (!WHITELIST_ENABELED || WHITELIST_IP.has(req.ip)) {
    next()
  } else {
    log(`REJECT ${req.ip} ${decodeURI(req.url)}`)
    res.status(403).send(`You are not authorized<br>${req.ip}`).end()
  }
}

export function admin (req:Request, res:Response, next:NextFunction) {
  const is_admin = req.ip == get_admin_ip() || req.ip == localhost
  const is_pw_correct = req.query.pw && req.query.pw == RET_PW
  if (is_admin || is_pw_correct) {
    next()
  } else {
    log(`Unauthorized admin access from ${req.ip}`)
    res.sendStatus(401).end()
  }
}
