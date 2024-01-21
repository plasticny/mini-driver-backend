import { dirname } from 'path'

// root path of the asset
export const ROOT_ASSET_PATH = `${dirname(dirname(require.main.filename))}/asset`
// temp folder path
export const TEMP_PATH = `${dirname(dirname(require.main.filename))}/temp`

// logger
const date = new Date()
export const LOG_FOLDER_PATH = `${dirname(dirname(require.main.filename))}/log`
export const LOG_FILE_NM = `${date.getFullYear()}${date.getMonth()+1}${date.getDate()}.txt`
export const LOG_FILE_PATH = `${LOG_FOLDER_PATH}/${LOG_FILE_NM}`