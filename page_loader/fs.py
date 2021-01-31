import logging
import os


def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)
    else:
        logging.warning('The directory exists already')


def create_file(path, name, content):
    if not os.path.exists(path):
        raise FileNotFoundError('No such file or directory')
    if not os.path.isdir(path):
        raise NotADirectoryError(f' {path} is Not a directory')
    if not os.access(path, os.R_OK):
        raise PermissionError(f'Cannot save in {path}: Read-only file system')
    file_path = os.path.join(path, name)
    with open(file_path, 'wb') as content_file:
        content_file.write(content)
