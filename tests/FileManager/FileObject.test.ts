import { ARetFileObject, AFileObject } from '../../src/FileManager/FileObject'
import { AFolder } from '../../src/FileManager/Folder'

class RetFileObject extends ARetFileObject {
  constructor(obj : AFileObject) {
    super(obj, 'file')
  }
}
class FileObject extends AFileObject {
  public get ret_obj() : ARetFileObject {
    return new RetFileObject(this)
  }
  public is_lock() : boolean {
    return false
  }
}
class FakeFolder extends AFolder {
  constructor() {
    super('fake folder', null)
    this._path = 'fake_folder'
  }
}

let fake_folder : FakeFolder
beforeAll(() => {
  fake_folder = new FakeFolder()
})

describe('testing FileObject', () => {
  test('instantiate File object ', () => {
    const file_obj1 = new FileObject('test1', null)
    expect(file_obj1.id).toBe(1)
    expect(file_obj1.name).toBe('test1')
    
    const file_obj2 = new FileObject('test2', fake_folder)
    expect(file_obj2.id).toBe(2)
    expect(file_obj2.name).toBe('test2')
    expect(file_obj2.path).toBe('fake_folder/test2')
    expect(file_obj2.folder).toBe(fake_folder)

    expect(fake_folder.file_objs).toEqual([file_obj2])
  })

  test('get returned file object', () => {
    const file_obj = new FileObject('test', null)
    expect(file_obj.ret_obj.toJSON()).toEqual({
      id: file_obj.id,
      name: file_obj.name,
      type: 'file'
    })
  })
})