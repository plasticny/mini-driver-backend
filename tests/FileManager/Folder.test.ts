import { Root } from '../../src/FileManager/Folder'
import { prepare_test_asset } from '../test_helper'


const root_path_mock = jest.fn(() => './tests/test_files/test_asset')
jest.mock('../../src/constants', () => ({
  get ROOT_ASSET_PATH() { return root_path_mock() }
}))


let ROOT : Root = new Root()
beforeAll(() => {
  prepare_test_asset()
  ROOT = new Root()
})


describe('testing folder', () => {
  test('create root object', () => {
    expect(ROOT.path).toBe(root_path_mock())

    const root_files = ROOT.files
    expect(root_files.length).toBe(1)
    expect(root_files[0].name).toBe('test_file1.txt')

    const root_folders = ROOT.folders
    expect(root_folders.length).toBe(1)
    expect(root_folders[0].name).toBe('test_folder')

    const root_file_objs = ROOT.file_objs
    expect(root_file_objs.length).toBe(2)
    expect(root_file_objs).toContain(root_files[0])
    expect(root_file_objs).toContain(root_folders[0])
  })

  test('create folder object', () => {
    const folder = ROOT.folders[0]

    const folder_files = folder.files
    expect(folder_files.length).toBe(1)
    expect(folder_files[0].name).toBe('test_file2.txt')

    const folder_folders = folder.folders
    expect(folder_folders.length).toBe(0)

    const folder_file_objs = folder.file_objs
    expect(folder_file_objs.length).toBe(1)
    expect(folder_file_objs).toContain(folder_files[0])
  })

  test('add/remove object', () => {
    const folder = ROOT.folders[0]
    const file = folder.files[0]

    folder.remove_obj(file.id)
    expect(folder.file_objs.length).toBe(0)

    folder.add_obj(file)
    expect(folder.file_objs.length).toBe(1)
    expect(folder.file_objs).toContain(file)
  })

  test('returned folder object', () => {
    const folder = ROOT.folders[0]
    const ret_folder = folder.ret_obj

    expect(ret_folder.toJSON()).toEqual({
      id: folder.id,
      name: folder.name,
      type: 'folder',
      path: [
        { id: ROOT.id, name: ROOT.name },
        { id: folder.id, name: folder.name }
      ]
    })
  })

  test('read folder function', () => {
    const folder = ROOT.folders[0]
    const file = ROOT.files[0]

    const root_read_ret = ROOT.read()
    expect(root_read_ret.length).toBe(2)
    expect(root_read_ret).toContainEqual(file.ret_obj)
    expect(root_read_ret).toContainEqual(folder.ret_obj)      
  })

  test('is_lock function', () => {
    const folder = ROOT.folders[0]

    expect(ROOT.is_lock()).toBe(false)
    expect(folder.is_lock()).toBe(false)

    ROOT.files[0].add_lock()
    expect(ROOT.is_lock()).toBe(true)
    expect(folder.is_lock()).toBe(false)

    ROOT.files[0].release_lock()
    folder.files[0].add_lock()
    expect(ROOT.is_lock()).toBe(true)
    expect(folder.is_lock()).toBe(true)

    folder.files[0].release_lock()
    expect(ROOT.is_lock()).toBe(false)
    expect(folder.is_lock()).toBe(false)
  })
})