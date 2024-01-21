import { File } from '../../src/FileManager/File'
import { AFolder } from '../../src/FileManager/Folder'

class FakeFolder extends AFolder {
  constructor() {
    super('fake folder', null)
  }
}

let fake_folder : FakeFolder
beforeAll(() => {
  fake_folder = new FakeFolder()
})

describe('testing File class', () => {
  test('test File lock', () => {
    const file = new File('test', fake_folder)
    expect(file.is_lock()).toBe(false)
    file.add_lock()
    expect(file.is_lock()).toBe(true)
    file.add_lock()
    file.release_lock()
    expect(file.is_lock()).toBe(true)
    file.release_lock()
    expect(file.is_lock()).toBe(false)
  })

  test('get returned file object', () => {
    const file = new File('test', fake_folder)
    expect(file.ret_obj.toJSON()).toEqual({
      id: file.id,
      name: file.name,
      type: 'file',
      is_lock: false
    })

    file.add_lock()
    expect(file.ret_obj.toJSON()).toEqual({
      id: file.id,
      name: file.name,
      type: 'file',
      is_lock: true
    })
  })
})