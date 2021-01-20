import logging
import os

from page_loader.url_formatter import to_directory_name


def create_directory(path, name):
    directory_path = to_directory_name(path, name)
    if os.path.exists(directory_path):
        print(f'\nPlease, pay attention that the website '
              f'had been downloaded in {path} before.\n')
    else:
        os.makedirs(directory_path)
    return directory_path


def create_file(path, name, content):
    full_path = to_directory_name(path, name)
    try:
        with open(full_path, 'wb') as content_file:
            content_file.write(content)
    except NotADirectoryError:
        logging.error(f' {path} is Not a directory')
        raise NotADirectoryError
    except FileNotFoundError:
        logging.error('No such file or directory')
        raise FileNotFoundError
    except PermissionError:
        logging.error(f'Cannot save in {path}: Read-only file system')
        raise PermissionError
    except OSError:
        logging.error('OSError: Read-only file system')
        raise OSError
