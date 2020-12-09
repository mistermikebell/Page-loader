import requests

from page_loader import urlformatter
from page_loader import image_loader


def stringify(path):
    if isinstance(path, bytes):
        return path.decode()
    return path.strip('/')


def download(url, path):
    call = requests.get(url)
    directory = stringify(path)
    html_file_name = urlformatter.format(url)
    changed_src_html = image_loader.load(url, call.content, directory)
    html_file_path = f'{directory}/{html_file_name}.html'
    with open(html_file_path, 'w+') as content_file:
        content_file.write(changed_src_html)
    return html_file_path
