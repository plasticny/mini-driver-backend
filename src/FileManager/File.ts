import { AFileObject, ARetFileObject } from './FileObject'
import { AFolder } from './Folder'

export class RetFile extends ARetFileObject {
  /* file info returned to frontend */
  protected _is_lock: boolean
  constructor(file : File) {
    super(file, 'file')
    this._is_lock = file.is_lock()
  }
  public toJSON(): object {
    return {
      ...super.toJSON(),
      is_lock: this._is_lock
    }
  }
}

export class File extends AFileObject {
  private __lock : number // 0: not lock, > 0: locking

  constructor(name : string, folder : AFolder) {
    super(name, folder)
    this.__lock = 0
  }

  public get ret_obj() : RetFile { return new RetFile(this) }

  public is_lock() : boolean { return this.__lock != 0 }
  public add_lock() : void { this.__lock++ }
  public release_lock() : void { if (this.__lock > 0) this.__lock-- }
}