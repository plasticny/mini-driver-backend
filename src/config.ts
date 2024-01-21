import { get } from 'https'

export const PORT = 3000
export const localhost = '::1'

// anthorization
export const AUTH_PW = '5214' // user need to enter this to get the RET_PW
export const RET_PW = '2849' // user need this to access some api

// whitelist for entering the website
export const WHITELIST_ENABELED = true
export const WHITELIST_IP : Set<string> = new Set([
  localhost
])

export let admin_ip : string = ''
export function get_admin_ip() { return admin_ip }

export function init() {
  get('https://api.ipify.org', (res) => {
    res.on('data', (d) => {
      admin_ip = `::ffff:${String(d)}`
      WHITELIST_IP.add(admin_ip)
    })
  }).on('error', (e) => { throw e })
}

init()