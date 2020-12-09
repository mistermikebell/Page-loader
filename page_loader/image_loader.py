import requests

import shutil

import os

from page_loader import urlformatter
from urllib.parse import urlparse
from os.path import splitext, basename
from bs4 import BeautifulSoup


def get_image_urls(content):
    soup = BeautifulSoup(content, features="html.parser")
    return [img['src'] for img in soup.find_all('img')]


def create_files_directory(path, formatted_url):
    directory_path = f'{path}/{formatted_url}_files'
    if os.path.exists(directory_path):
        shutil.rmtree(directory_path)
    os.makedirs(directory_path)
    return directory_path


def is_absolute(url):
    return bool(urlparse(url).netloc)


def get_name_and_extension(url):
    parsed = urlparse(url)
    short_path, extension = splitext(basename(parsed.path))
    long_path = f'{parsed.netloc}/{short_path}'
    formatted_url = urlformatter.format(long_path)
    return formatted_url, extension


def load(url, content, path):

    formatted_url = urlformatter.format(url)
    directory = create_files_directory(path, formatted_url)

    parsed = urlparse(url)
    soup = BeautifulSoup(content, features="html.parser")
    for img in soup.find_all('img'):
        image = img['src']
        print(img)
        if not is_absolute(image):
            image = '{}://{}/{}'.format(parsed.scheme, parsed.netloc, image)
        img_name, img_extension = get_name_and_extension(image)
        if img_extension not in ['.jpg', '.png']:
            continue
        img_path = f'{directory}/{img_name}{img_extension}'
        content = requests.get(image, stream=True)
        with open(img_path, 'wb') as image_file:
            shutil.copyfileobj(content.raw, image_file)
        img['src'] = f'{formatted_url}_files/{img_name}.{img_extension}'
    return str(soup)
