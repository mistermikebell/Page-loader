import requests

from page_loader.name_builder import build_file_name
from page_loader.saver import create_file


def stringify(path):
    if isinstance(path, bytes):
        return path.decode()
    return path.strip('/')


def download(url, path):
    call = requests.get(url)
    directory_path = stringify(path)
    file_name = build_file_name(url)
    file_path = "".join([directory_path, '/', file_name])
    create_file(file_path, call.text)
    return file_path
