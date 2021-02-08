import os


def check_path(path):
    if not os.path.exists(path):
        raise FileNotFoundError('No such file or directory')
    if not os.path.isdir(path):
        raise NotADirectoryError(f' {path} is Not a directory')
    if not os.access(path, os.W_OK):
        raise PermissionError(f'Cannot save in {path}: Read-only file system')


def create_directory(path):
    if not os.path.exists(path):
        os.mkdir(path, mode=0o755)


def create_file(path, name, content):
    file_path = os.path.join(path, name)
    mode, encoding = (('w', 'utf8')
                      if isinstance(content, str)
                      else ('wb', None))
    with open(file_path, mode=mode, encoding=encoding) as content_file:
        content_file.write(content)
