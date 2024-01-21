import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';

export const TEST_FILE_ROOT_PATH = `${__dirname}/test_files`
export const TEST_ASSET_PATH = `${TEST_FILE_ROOT_PATH}/test_asset`
export const TEST_LOG_PATH = `${TEST_FILE_ROOT_PATH}/test_log`
export const TEST_TEMP_PATH = `${TEST_FILE_ROOT_PATH}/test_temp`

export function prepare_test_file_root () {
  if (existsSync(TEST_FILE_ROOT_PATH)) {
    rmSync(TEST_FILE_ROOT_PATH, { recursive: true })
  }
  mkdirSync(TEST_FILE_ROOT_PATH)
}

export function prepare_test_asset () {
  const test_folder_path = `${TEST_ASSET_PATH}/test_folder`
  const test_file1_path = `${TEST_ASSET_PATH}/test_file1.txt`
  const test_file2_path = `${test_folder_path}/test_file2.txt`

  // clear test folder
  if (existsSync(TEST_ASSET_PATH)) { 
    rmSync(TEST_ASSET_PATH, { recursive: true })
  }
  mkdirSync(TEST_ASSET_PATH)

  // create nessecery files and folders
  mkdirSync(test_folder_path)
  writeFileSync(test_file1_path, 'test file 1')
  writeFileSync(test_file2_path, 'test file 2')
}

export function prepare_test_temp () {
  // clear test folder
  if (existsSync(TEST_TEMP_PATH)) {
    rmSync(TEST_TEMP_PATH, { recursive: true })
  }
  mkdirSync(TEST_TEMP_PATH)
}

export function prepare_test_log () {
  // clear test folder
  if (existsSync(TEST_LOG_PATH)) {
    rmSync(TEST_LOG_PATH, { recursive: true })
  }
  mkdirSync(TEST_LOG_PATH)
}
