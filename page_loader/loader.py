import logging

import requests

import sys

from page_loader import formatter
from page_loader import content
from page_loader import setup

logger = logging.getLogger(__name__)

printing_handler = logging.StreamHandler(sys.stdout)
printing_handler.setLevel(logging.INFO)
printing_handler.setFormatter(logging.Formatter('%(message)s'))

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.ERROR)
stream_handler.setFormatter(logging.Formatter('%(message)s'))

logger.addHandler(stream_handler)
logger.addHandler(printing_handler)


def stringify(path):
    if isinstance(path, bytes):
        return path.decode()
    return path.strip('/')


def load_website(url, path):
    logger.debug("Send GET request")
    logger.info(f'\nConnecting to {url} ...\n')
    try:
        call = requests.get(url)
    except requests.exceptions.ConnectionError:
        logger.error(f'Cannot open resource on {url}. Connection status is'
                     f'{call.status_code}')
    directory = stringify(path)
    html_file_name = formatter.format(url)
    logger.info('Connection established\nStarting to load content\n')
    changed_src_html = content.load(url, call.content, directory)
    html_file_path = f'{directory}/{html_file_name}.html'
    with open(html_file_path, 'w+') as content_file:
        content_file.write(changed_src_html)
    return html_file_path
