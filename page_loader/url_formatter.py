import re

from os.path import splitext, basename, join
from urllib.parse import urlparse


def to_file_name(url):
    parsed_url = urlparse(url)
    no_scheme_url = (parsed_url.netloc + parsed_url.path)
    return re.sub(r'[^\d\w]+', '-', no_scheme_url).strip('-')


def to_directory_name(path, name):
    return join(path, name)


def to_file_name_with_extension(url):
    parsed = urlparse(url)
    short_path, extension = splitext(basename(parsed.path))
    long_path = join(parsed.netloc, short_path)
    formatted_url = to_file_name(long_path)
    return f'{formatted_url}{extension}'
