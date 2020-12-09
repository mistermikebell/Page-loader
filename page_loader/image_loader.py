import requests

import shutil

import os

from page_loader import urlformatter
from urllib.parse import urlparse
from os.path import splitext, basename
from bs4 import BeautifulSoup


def is_absolute(url):
    return bool(urlparse(url).netloc)


def create_content_directory(path, formatted_url):
    directory_path = f'{path}/{formatted_url}_files'
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
    os.makedirs(directory_path)
    return directory_path


def get_name_and_extension(url):
    parsed = urlparse(url)
    short_path, extension = splitext(basename(parsed.path))
    long_path = f'{parsed.netloc}/{short_path}'
    formatted_url = urlformatter.format(long_path)
    return formatted_url, extension


def load(url, content, path):

    formatted_url = urlformatter.format(url)
    directory = create_content_directory(path, formatted_url)

    parsed = urlparse(url)
    soup = BeautifulSoup(content, features="html.parser")

    for tag in soup.find_all(['img', 'link', 'script']):
        if not tag.get('src'):
            continue
        source = tag['src']
        if not is_absolute(source):
            source = '{}://{}/{}'.format(parsed.scheme, parsed.netloc, source)
        else:
            continue
        src_name, src_extension = get_name_and_extension(source)
        if src_extension == '' and tag == 'link':
            src_extension == 'html'
        if src_extension not in ['.jpg', '.png', '.css', '.html', '.js']:
            continue
        print(source)
        src_path = f'{directory}/{src_name}{src_extension}'
        content = requests.get(source, stream=True)
        with open(src_path, 'wb') as src_file:
            shutil.copyfileobj(content.raw, src_file)
        tag['src'] = f'{formatted_url}_files/{src_name}{src_extension}'
    return str(soup)
