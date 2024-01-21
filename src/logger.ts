import { appendFileSync, existsSync, mkdirSync } from 'fs'
import { LOG_FOLDER_PATH, LOG_FILE_PATH } from './constants'

export function init() {
  // create log folder if not exist
  if (!existsSync(LOG_FOLDER_PATH)) {
    mkdirSync(LOG_FOLDER_PATH)
  }
  // create log file
  appendFileSync(LOG_FILE_PATH, '')
}
export function log(msg : string) {
  msg = `[${new Date().toLocaleString()}] ${msg}`
  console.log(msg)
  appendFileSync(LOG_FILE_PATH, `${msg}\n`)
}
export function log_err(msg : string) {
  msg = `ERROR [${new Date().toLocaleString()}] ${msg}`
  console.log(msg)
  appendFileSync(LOG_FILE_PATH, `${msg}\n`)
}

init()