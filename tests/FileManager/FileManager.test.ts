import { existsSync, writeFileSync } from 'fs'
import { File as form_file } from 'formidable'

import { File } from '../../src/FileManager/File'
import { FileManager } from '../../src/FileManager/FileManager'
import { AFileObject, ARetFileObject } from '../../src/FileManager/FileObject'
import { AFolder, Folder, Root } from '../../src/FileManager/Folder'
import { prepare_test_asset, prepare_test_temp } from '../test_helper'
import { ROOT_ASSET_PATH, TEMP_PATH } from '../../src/constants'

jest.mock('../../src/constants', () => ({
  get ROOT_ASSET_PATH() { return './tests/test_files/test_asset' },
  get TEMP_PATH() { return './tests/test_files/test_temp' }
}))


class test_FileManager extends FileManager {
  public get file_obj_map() : Map<number, AFileObject> {
    return this.__file_obj_map
  }
  public get root() {
    return this.__root
  }

  public __get_obj(id: number): AFileObject {
    return super.__get_obj(id)    
  }
  public __get_file(id: number): File {
    return super.__get_file(id)
  }
  public __get_folder(id: number): AFolder {
    return super.__get_folder(id)
  }

  public __add_obj(obj: AFileObject): void {
    super.__add_obj(obj)    
  }

  public __prepare_store_name(name: string, folder: Folder, ext?: string): string {
    return super.__prepare_store_name(name, folder, ext)    
  }
}
class test_RetFileObject extends ARetFileObject {
  constructor(obj: AFileObject) {
    super(obj, 'file')
  }
}
class test_FileObject extends AFileObject {
  constructor(name: string, folder: AFolder | null) {
    super(name, folder)
  }
  public get ret_obj() {
    return new test_RetFileObject(this)
  }
  public is_lock() {
    return false
  }
}

beforeAll(prepare_test_asset)

describe('test create file manager', () => {
  test('added all file objects to map', () => {
    const fm = new test_FileManager()
    expect(fm.file_obj_map.size).toBe(4)
    
    const root = fm.root
    const file1 = root.files[0]
    const folder1 = root.folders[0]
    const file2 = folder1.files[0]

    expect(fm.file_obj_map.get(root.id)).toBe(root)
    expect(fm.file_obj_map.get(file1.id)).toBe(file1)
    expect(fm.file_obj_map.get(folder1.id)).toBe(folder1)
    expect(fm.file_obj_map.get(file2.id)).toBe(file2)
  })
})

describe('test get file object', () => {
  let fm : test_FileManager
  let root : Root
  let file1 : File
  let folder : Folder

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    file1 = root.files[0]
    folder = root.folders[0]
  })

  test('get a exist file object', () => {
    expect(fm.__get_obj(root.id)).toBe(root)
  })
  test('get a non-exist file object', () => {
    expect(() => fm.__get_obj(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })

  test('get a file object with type check', () => {
    expect(fm.__get_file(file1.id)).toBe(file1)
  })
  test('get a non-file object with type check', () => {
    expect(() => fm.__get_file(root.id)).toThrow(
      `Object with id ${root.id} is not a file`
    )
  })

  test('get a folder object with type check', () => {
    expect(fm.__get_folder(folder.id)).toBe(folder)
  })
  test('get a non-folder object with type check', () => {
    expect(() => fm.__get_folder(file1.id)).toThrow(
      `Object with id ${file1.id} is not a folder`
    )
  })
})

describe('test add file object', () => {
  let fm : test_FileManager
  let root : Root

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
  })

  test('add file object function', () => {
    const new_file = new test_FileObject('new_file', null)
    fm.__add_obj(new_file)
    expect(fm.file_obj_map.size).toBe(5)
    expect(fm.file_obj_map.get(new_file.id)).toBe(new_file)
  })
  test('add file object with same id', () => {
    expect(() => fm.__add_obj(root)).toThrow(
      `Object with id ${root.id} already exist`
    )
  })
})

describe('test check lock function', () => {
  let fm : test_FileManager
  let root : Root
  let folder : Folder
  let file2 : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    folder = root.folders[0]
    file2 = folder.files[0]
  })

  it('pass the test', () => {
    expect(fm.check_lock(file2.id)).toBe(false)
    expect(fm.check_lock(folder.id)).toBe(false)

    file2.add_lock()

    expect(fm.check_lock(file2.id)).toBe(true)
    expect(fm.check_lock(folder.id)).toBe(true)
  })
})

describe('test delete object function', () => {
  let fm : test_FileManager
  let root : Root
  let folder : Folder
  let file1 : File
  let file2 : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    folder = root.folders[0]
    file1 = root.files[0]
    file2 = folder.files[0]
  })
  afterAll(() => {
    prepare_test_asset()
  })

  test('delete a non-exist object', () => {
    expect(() => fm.delete_obj(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })

  test('fail to delete a locked object', () => {
    file1.add_lock()
    expect(() => fm.delete_obj(file1.id)).toThrow(
      `File object ${file1.name} is locked`
    )
    expect(fm.__get_obj(file1.id)).toBe(file1)
    file1.release_lock()
  })

  test('delete a file object', () => {
    fm.delete_obj(file1.id)
    expect(fm.file_obj_map.size).toBe(3)
    expect(() => fm.__get_obj(file1.id)).toThrow(
      `Object with id ${file1.id} does not exist`
    )
    expect(root.files.length).toBe(0)
  })
  test('delete a folder object', () => {
    fm.delete_obj(folder.id)
    expect(fm.file_obj_map.size).toBe(1)
    expect(() => fm.__get_obj(folder.id)).toThrow(
      `Object with id ${folder.id} does not exist`
    )
    expect(() => fm.__get_obj(file2.id)).toThrow(
      `Object with id ${file2.id} does not exist`
    )
    expect(root.folders.length).toBe(0)
  })
})

describe('test get object\'s folder id', () => {
  let fm : test_FileManager
  let root : Root
  let folder : Folder
  let file2 : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    folder = root.folders[0]
    file2 = folder.files[0]
  })

  test('get object\'s folder id', () => {
    expect(fm.get_folder_id(file2.id)).toBe(folder.id)
    expect(fm.get_folder_id(folder.id)).toBe(root.id)
  })

  test('when the object is not exist', () => {
    expect(() => fm.get_folder_id(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })

  test('when the object does not in a folder', () => {
    expect(() => fm.get_folder_id(root.id)).toThrow(
      `File object ${root.name} is not in any folder`
    )
  })
})

describe('test functions of reading folder', () => {
  let fm : test_FileManager
  let root : Root

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
  })

  test('read_folder function', () => {
    expect(fm.read_folder(root.id)).toEqual(root.read())
  })
  test('read not exist folder', () => {
    expect(() => fm.read_folder(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })

  test('get_folder_info function', () => {
    expect(fm.get_folder_info(root.id)).toEqual(root.ret_obj)
  })
  test('get folder info of not exist folder', () => {
    expect(() => fm.get_folder_info(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })
})

describe('test add folder function', () => {
  let fm : test_FileManager
  let root : Root
  let file : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    file = root.files[0]

    jest.spyOn(fm, '__prepare_store_name').mockReturnValue('test_name')
  })

  afterAll(prepare_test_asset)

  test('add folder to root', () => {
    const ret_folder = fm.add_folder(root.id, 'test_name')
    // fm stored the new folder
    expect(fm.file_obj_map.size).toBe(5)
    // root (new folder's parent) store the new folder
    expect(root.folders.length).toBe(2)
    expect(root.read()).toContainEqual(ret_folder)
    // the info of the new folder
    expect(ret_folder.toJSON()).toEqual({
      id: expect.any(Number),
      name: 'test_name',
      type: 'folder',
      path: [
        { id: root.id, name: root.name },
        { id: expect.any(Number), name: 'test_name' }
      ]
    })
    // the folder is created
    expect(existsSync(`${ROOT_ASSET_PATH}/test_name`)).toBe(true)
  })

  test('failed if add folder to a file', () => {
    expect(() => fm.add_folder(file.id, 'test_name')).toThrow(
      `Object with id ${file.id} is not a folder`
    )
  })
  test('failed if add folder to a non-exist folder', () => {
    expect(() => fm.add_folder(999, 'test_name')).toThrow(
      `Object with id 999 does not exist`
    )
  })
})

describe('test get file path function', () => {
  let fm : test_FileManager
  let root : Root
  let file : File
  let folder : Folder

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    file = root.files[0]
    folder = root.folders[0]
  })

  test('get file path', () => {
    expect(fm.get_file_path(file.id)).toEqual(file.path)
  })

  test('failed when the object is not exist', () => {
    expect(() => fm.get_file_path(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })
  test('failed when the object is not file', () => {
    expect(() => fm.get_file_path(folder.id)).toThrow(
      `Object with id ${folder.id} is not a file`
    )
  })
})

describe('test file lock function', () => {
  let fm : test_FileManager
  let root : Root
  let folder : Folder
  let file1 : File
  let file2 : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    folder = root.folders[0]
    file1 = root.files[0]
    file2 = folder.files[0]
  })

  test('add file lock', () => {
    fm.add_file_lock(file1.id)
    expect(file1.is_lock()).toBe(true)
  })
  test('failed when the object to be locked is not exist', () => {
    expect(() => fm.add_file_lock(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })
  test('failed when the object to be locked is not file', () => {
    expect(() => fm.add_file_lock(folder.id)).toThrow(
      `Object with id ${folder.id} is not a file`
    )
  })

  test('release file lock', () => {
    fm.add_file_lock(file2.id)
    fm.release_file_lock(file2.id)
    expect(file2.is_lock()).toBe(false)
  })
  test('failed when the object to be released is not exist', () => {
    expect(() => fm.release_file_lock(999)).toThrow(
      `Object with id 999 does not exist`
    )
  })
  test('failed when the object to be released is not file', () => {
    expect(() => fm.release_file_lock(folder.id)).toThrow(
      `Object with id ${folder.id} is not a file`
    )
  })
})

describe('test store_temp_file function', () => {
  let fm : test_FileManager
  let root : Root
  let folder : Folder
  let file : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    folder = root.folders[0]
    file = root.files[0]
    prepare_test_temp()
  })

  afterAll(() => {
    prepare_test_asset()
    prepare_test_temp()
  })

  test('store temp file to root', () => {
    const temp_file_nm = 'test_temp_file_1.txt'

    writeFileSync(`${TEMP_PATH}/${temp_file_nm}`, 'test content')

    const form_file : Partial<form_file> = {
      originalFilename: temp_file_nm,
      filepath: `${TEMP_PATH}/${temp_file_nm}`
    }

    jest
      .spyOn(fm, '__prepare_store_name')
      .mockReturnValue(temp_file_nm)

    const file_nm = fm.store_temp_file(form_file as form_file, root.id)

    // returned name
    expect(file_nm).toBe(temp_file_nm)
    // fm stored the new file
    expect(fm.file_obj_map.size).toBe(5)
    // root stored the new file
    expect(root.files.length).toBe(2)
    // temp file is moved to the root folder
    expect(existsSync(`${root.path}/${temp_file_nm}`)).toBe(true)
    expect(existsSync(`${TEMP_PATH}/${temp_file_nm}`)).toBe(false)
  })

  test('store temp file to root', () => {
    const temp_file_nm = 'test_temp_file_2.txt'

    writeFileSync(`${TEMP_PATH}/${temp_file_nm}`, 'test content')

    const form_file : Partial<form_file> = {
      originalFilename: temp_file_nm,
      filepath: `${TEMP_PATH}/${temp_file_nm}`
    }

    jest
      .spyOn(fm, '__prepare_store_name')
      .mockReturnValue(temp_file_nm)

    const file_nm = fm.store_temp_file(form_file as form_file, folder.id)

    // returned name
    expect(file_nm).toBe(temp_file_nm)
    // fm stored the new file
    expect(fm.file_obj_map.size).toBe(6)
    // root stored the new file
    expect(folder.files.length).toBe(2)
    // temp file is moved to the root folder
    expect(existsSync(`${folder.path}/${temp_file_nm}`)).toBe(true)
    expect(existsSync(`${TEMP_PATH}/${temp_file_nm}`)).toBe(false)
  })

  test('failed when folder is not exist', () => {
    const form_file : Partial<form_file> = {
      originalFilename: 'foo',
      filepath: 'foo'
    }
    expect(() => fm.store_temp_file(form_file as form_file, 999)).toThrow(
      `Object with id 999 does not exist`
    )
  })
  test('failed when object with folder_id is not a folder', () => {
    const form_file : Partial<form_file> = {
      originalFilename: 'foo',
      filepath: 'foo'
    }
    expect(() => fm.store_temp_file(form_file as form_file, file.id)).toThrow(
      `Object with id ${file.id} is not a folder`
    )
  })
})

describe('test prepare_store_name function', () => {
  let fm : test_FileManager
  let root : Root
  let file : File

  beforeAll(() => {
    fm = new test_FileManager()
    root = fm.root
    file = root.files[0]
  })

  test('prepare folder name', () => {
    const ret_nm = fm.__prepare_store_name('test_folder2', root)
    expect(ret_nm).toBe('test_folder2')
  })

  test('prepare file name which name already exist', () => {
    const ret_nm = fm.__prepare_store_name('test_file1', root, 'txt')
    expect(ret_nm).toBe('test_file1_1.txt')
  })
  test('prepare previous name again, but the previous returned name also exist', () => {
    writeFileSync(`${root.path}/test_file1_1.txt`, 'test content')

    const ret_nm = fm.__prepare_store_name('test_file1', root, 'txt')
    expect(ret_nm).toBe('test_file1_2.txt')

    prepare_test_asset()
  })
})
