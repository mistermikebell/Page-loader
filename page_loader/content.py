import logging
import os
import requests
import shutil

import progressbar

from page_loader import formatter
from urllib.parse import urlparse
from os.path import splitext, basename
from bs4 import BeautifulSoup

EXTENSIONS = ['.jpg', '.png', '.css', '.html', '.js']

logger = logging.getLogger(__name__)

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.ERROR)
stream_handler.setFormatter(logging.Formatter('%(message)s'))

logger.addHandler(stream_handler)


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
    formatted_url = formatter.format(long_path)
    return formatted_url, extension


def load(url, content, path):

    formatted_url = formatter.format(url)
    directory = create_content_directory(path, formatted_url)

    parsed = urlparse(url)
    soup = BeautifulSoup(content, features="html.parser")
    bar = progressbar.ProgressBar(max_value=progressbar.UnknownLength,
                                  redirect_stdout=True)
    for tag in soup.find_all(['img', 'link', 'script']):
        if tag.get('src'):
            source = tag['src']
        elif tag.get('href'):
            source = tag['href']
        else:
            continue
        if not is_absolute(source):
            source.strip('/')
            source = '{}://{}/{}'.format(parsed.scheme, parsed.netloc, source)
        else:
            continue
        src_name, src_extension = get_name_and_extension(source)
        if src_extension == '' and tag == 'link':
            src_extension = 'html'
        if src_extension not in EXTENSIONS:
            continue
        print(source)
        src_path = f'{directory}/{src_name}{src_extension}'
        try:
            call = requests.get(source, stream=True)
        except requests.exceptions.ConnectionError:
            logger.error(f'Cannot open {source}. Connection status is'
                         f'{content.status_code}')
        with open(src_path, 'wb') as src_file:
            src_file.write(call.content)
        tag['src'] = f'{formatted_url}_files/{src_name}{src_extension}'
        bar.update(1)
    return str(soup)
