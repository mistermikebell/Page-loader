import logging
import os
import requests
import sys

from page_loader import formatter
from page_loader import content
from page_loader.setup import set_logging
from requests import HTTPError

set_logging()
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


def download(url, path):
    if not os.path.exists(path):
        raise OSError
        logger.error(f'{path} doesn\'t exists')
    logger.debug("Send GET request")
    logger.info(f'\nConnecting to {url} ...\n')
    call = requests.get(url)
    http_error_msg = None
    if 400 <= call.status_code < 500:
        http_error_msg = f'Cannot open {url}: {call.status_code} Client Error'
    elif 500 <= call.status_code < 600:
        http_error_msg = f'Cannot open {url}: {call.status_code} Server Error'
    if http_error_msg:
        raise HTTPError(http_error_msg)
        logger.error(f'Cannot open {url}'
                     f'Connection refused')
    directory = stringify(path)
    html_file_name = formatter.format(url)
    logger.info('Connection established\nStarting to load content\n')
    changed_src_html = content.load(url, call.content, directory)
    html_file_path = f'{directory}/{html_file_name.strip("-")}.html'
    try:
        with open(html_file_path, 'w+') as content_file:
            content_file.write(changed_src_html)
    except PermissionError:
        logger.error(f'Cannot create file in {directory}')
        raise PermissionError
    return html_file_path
