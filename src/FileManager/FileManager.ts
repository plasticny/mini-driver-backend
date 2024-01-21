import { existsSync, mkdirSync, renameSync, unlinkSync, rmSync, readdirSync } from 'fs'
import { File as form_file } from 'formidable'

import { AFileObject, ARetFileObject } from './FileObject'
import { AFolder, Folder, RetFolder } from './Folder'
import { Root } from './Folder'
import { File } from './File'
import { ROOT_ASSET_PATH, TEMP_PATH } from '../constants'


export class FileManager {
  // map file object with internal id
  protected __file_obj_map : Map<number, AFileObject> = new Map()
  protected __root : Root

  constructor() {
    // create nessecery folders
    if (!existsSync(ROOT_ASSET_PATH))
      mkdirSync(ROOT_ASSET_PATH)
    if (!existsSync(TEMP_PATH))
      mkdirSync(TEMP_PATH)

    // clear temp folder
    readdirSync(TEMP_PATH).forEach((file) => {
      unlinkSync(`${TEMP_PATH}/${file}`)
    })
    
    this.__root = new Root()

    // add all file objects to the map
    this.__add_obj(this.__root)
    const file_objs = this.__root.file_objs
    while (file_objs.length > 0) {
      const file_obj = file_objs.pop()
      this.__add_obj(file_obj)
      if (file_obj instanceof AFolder) {
        file_objs.push(...file_obj.file_objs)
      }
    }
  }

  /* ================= File object map ================= */
  protected __get_obj(id: number) : AFileObject {
    const obj = this.__file_obj_map.get(id)
    if (obj === undefined) {
      throw `Object with id ${id} does not exist`
    }
    return obj
  }
  /* get file object with type check */
  protected __get_file(id : number) : File {
    const obj = this.__get_obj(id)
    if (obj instanceof File) {
      return obj
    } else {
      throw `Object with id ${id} is not a file`
    }
  }
  /* Get folder object with type check */
  protected __get_folder(id: number) : AFolder {
    const obj = this.__get_obj(id)
    if (obj instanceof AFolder) {
      return obj
    } else {
      throw `Object with id ${id} is not a folder`
    }
  }

  /* store a file object with a internal id */
  protected __add_obj(obj : AFileObject) {
    if (this.__file_obj_map.has(obj.id)) {
      throw `Object with id ${obj.id} already exist`
    }
    this.__file_obj_map.set(obj.id, obj)
  }

  public delete_obj(id : number) {
    /* Delete a file object */
    const file_obj = this.__get_obj(id)
    if (file_obj.is_lock()) {
      throw `File object ${file_obj.name} is locked`
    }

    // remove from parent folder memory
    file_obj.folder.remove_obj(id)

    // remove file object
    if (file_obj instanceof AFolder) {
      rmSync(file_obj.path, { recursive: true })
    } else {
      unlinkSync(file_obj.path)
    }

    // remove from file object map
    const delete_obj_lst = [file_obj]
    while (delete_obj_lst.length > 0) {
      const obj = delete_obj_lst.pop()
      if (obj instanceof AFolder) {
        delete_obj_lst.push(...obj.file_objs)
      }
      this.__file_obj_map.delete(obj.id)
    }
  }
  /* Check if file object with id `id` is locked */
  public check_lock(id : number) : boolean {
    return this.__get_obj(id).is_lock()
  }
  /* Get the id of folder that contains the file object with id `id` */
  public get_folder_id(obj_id : number) : number {
    const file_obj = this.__get_obj(obj_id)
    if (!file_obj.folder) {
      throw `File object ${file_obj.name} is not in any folder`
    }
    return file_obj.folder.id
  }
  /* ================= File object map ================= */

  /* ================= Folder ================= */
  /* read and return a dict of items in the folder with `id` */
  public read_folder(id : number) : Array<ARetFileObject> {
    return this.__get_folder(id).read()
  }
  /* Get the info of folder */
  public get_folder_info(id : number) : RetFolder {
    return this.__get_folder(id).ret_obj
  }
  /* add folder */
  public add_folder(parent_id : number, name : string) : RetFolder {
    const parent = this.__get_folder(parent_id)

    // prepare folder name
    const folder_nm = this.__prepare_store_name(name, parent)

    // create folder
    mkdirSync(`${parent.path}/${folder_nm}`)
    const folder = new Folder(folder_nm, parent)

    this.__add_obj(folder)
    return folder.ret_obj
  }
  /* ================= Folder ================= */

  /* ================= File ================= */
  public get_file_path(id : number) : string {
    /* Get path of file object */
    return this.__get_file(id).path
  }
  public add_file_lock(id : number) {
    /* increase file lock */
    this.__get_file(id).add_lock()
  }
  public release_file_lock(id : number) {
    /* release file lock */
    this.__get_file(id).release_lock()
  }
  /* 
    Move a file from temp to the folder with id `folder_id`,
    then store into file object map
  */
  public store_temp_file(file : form_file, folder_id : number) : string {
    /* 
      Args:
        `file`: a file object from formidable.IncomingForm.parse
      Return:
        (string) the name of file stored to target folder
    */
    // separate file name and extension
    const last_dot_idx = file.originalFilename.lastIndexOf('.')
    const original_file_nm = file.originalFilename.slice(0, last_dot_idx)
    const file_ext = file.originalFilename.slice(last_dot_idx+1)
    const folder = this.__get_folder(folder_id)

    // prepare file name
    const file_nm = this.__prepare_store_name(original_file_nm, folder, file_ext)

    // move to the target folder
    renameSync(file.filepath, `${folder.path}/${file_nm}`)
    // store to the map
    this.__add_obj(new File(file_nm, folder))

    return file_nm
  }
  /* ================= File ================= */

  /* ================= Helper Functions ================= */
  /* modify the name of the received file or folder for the final name stored in the machine */
  protected __prepare_store_name (name : string, folder : Folder, ext : string = '') : string {
    /*
      Args:
        name: the original name of the file or folder, without extension
        folder: the folder that the file or folder will be in
        ext:  the extension of the file, for file only.
              do not add . to the extension. e.g. 'txt', 'jpg'
    */
    if (ext !== '') {
      ext = '.'+ext
    }

    let res = ''
    // esacpe special charater
    for(const c of name) {
      res += (c == '\\' || c == '/' || c == '／' || c == '?' || c == '？' || c == '!' || c == ' ' || c == '！') ? '_' : c
    }

    // add suffix if file name already exist
    if (existsSync(`${folder.path}/${res}${ext}`)) {
      let i = 1
      while (existsSync(`${folder.path}/${res}_${i}${ext}`)) { i++ }
      res += `_${i}`
    }

    return res+ext
  }
}
export const file_manager = new FileManager()