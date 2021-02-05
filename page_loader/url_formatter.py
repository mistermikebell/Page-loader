import os
import re

from urllib.parse import urlparse

FORMAT_URL_PATTERN = re.compile(r'_|[^\w\d]+')


def to_file_name(url):
    parsed_url = urlparse(url)
    path, extension = os.path.splitext(parsed_url.path)
    if extension == '':
        extension = '.html'
    no_scheme_url = parsed_url.netloc + path
    formatted_url = FORMAT_URL_PATTERN.sub('-', no_scheme_url).strip('-')
    return f'{formatted_url}{extension}'


def to_directory_name(url):
    formatted_url = to_file_name(url)
    name = formatted_url.split('.')[0]
    return f'{name}_files'
