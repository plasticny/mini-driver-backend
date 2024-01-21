import { AFolder } from './Folder'

// interval id for creating file objects
let file_obj_id = 0
function next_internal_id() : number {
  return file_obj_id++
}

export abstract class ARetFileObject {
  /* abstract file object info returned to frontend */
  protected _id: number
  protected _name: string
  protected _type: 'file' | 'folder'

  constructor(obj : AFileObject, type : 'file' | 'folder') {
    this._id = obj.id
    this._name = obj.name
    this._type = type
  }

  public toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      type: this._type
    }
  }
}

export abstract class AFileObject {
  protected _id : number
  protected _name : string
  protected _folder : AFolder | undefined
  protected _path : string | undefined

  constructor(name : string, folder : AFolder | null) {
    this._name = name
    this._id = next_internal_id()

    if(folder) {
      this._folder = folder
      this._path = `${folder.path}/${name}`
      this._folder.add_obj(this)
    }
  }

  public abstract get ret_obj() : ARetFileObject
  public abstract is_lock() : boolean

  public get id()        { return this._id }
  public get name()      { return this._name }
  public get folder()    { return this._folder }
  public get path()      { return this._path }
}