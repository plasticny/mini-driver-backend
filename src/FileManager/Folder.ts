import { AFileObject, ARetFileObject } from './FileObject'
import { File } from './File'
import { readdirSync } from 'fs'
import { ROOT_ASSET_PATH } from '../constants'

/* folder info returned to frontend */
export class RetFolder extends ARetFileObject  {
  // arrange from root to current folder
  private __path : Array<{ id: number, name: string }> = []

  constructor(folder : AFolder) {
    super(folder, 'folder')
    while (folder !== undefined) {
      this.__path.push({ id: folder.id, name: folder.name })
      folder = folder.folder
    }
    this.__path.reverse()
  }

  public toJSON(): object {
    return {
      ...super.toJSON(),
      // a list of folder id and name from root to current folder
      path: this.__path
    }
  }
}

/* abstract folder class */
export abstract class AFolder extends AFileObject {
  protected _file_obj_map : Map<number, AFileObject> = new Map()

  constructor(name : string, folder : AFolder | null) {
    super(name, folder)
  }

  public get ret_obj() : RetFolder { return new RetFolder(this) }
  public get file_objs() : Array<AFileObject> { return Array.from(this._file_obj_map.values()) }
  public get folders() : Array<AFolder> { return this.file_objs.filter(file => file instanceof AFolder) as Array<AFolder> }
  public get files() : Array<File> { return this.file_objs.filter(file => file instanceof File) as Array<File> }

  /* read the folder content */
  protected _load_dir () : void {
    for(const item of readdirSync(this.path, { withFileTypes:true })) {
      if (item.isDirectory()) {
        this.add_obj(new Folder(item.name, this))
      } else {
        this.add_obj(new File(item.name, this))
      }
    }
  }

  public add_obj(file : AFileObject) : void {
    this._file_obj_map.set(file.id, file)
  }

  public remove_obj(id : number) : void {
    this._file_obj_map.delete(id)
  }

  /* read folder content as some file objects that return to frontend */
  public read() : Array<ARetFileObject> {
    return this.file_objs.map(file_objs => file_objs.ret_obj)
  }

  /* check if any file inside this folder is locked */
  public is_lock() : boolean {
    const to_check : Array<AFileObject> = this.file_objs
    for (const file_obj of to_check) {
      if (file_obj.is_lock()) {
        return true
      }
      if (file_obj instanceof AFolder) {
        to_check.push(...file_obj.file_objs)
      }
    }
    return false
  }
}

/* folder */
export class Folder extends AFolder {
  constructor(name : string, folder : Folder) {
    super(name, folder)
    this._load_dir()
  }
}

/* folders in the root */
export class Root extends AFolder {
  constructor() {
    super('Root', null)
    this._path = ROOT_ASSET_PATH
    this._load_dir()
  }
}
