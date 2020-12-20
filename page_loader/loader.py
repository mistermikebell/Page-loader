import logging

import requests

import sys

import urllib3.exceptions as urexc

from page_loader import formatter
from page_loader import content
from page_loader.setup import set_logging

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
    logger.debug("Send GET request")
    logger.info(f'\nConnecting to {url} ...\n')
    try:
        call = requests.get(url)
    except ConnectionError:
        logger.error(f'Cannot open resource on {url}')
        return 0
    except urexc.MaxRetryError:
        logger.error(f'Cannot open resource on {url} 5')
        return 0
    except requests.exceptions.ConnectionError:
        logger.error(f'Cannot open resource on {url}\n'
                     f'[Erno 111] Connection refused')
        return 0
    except urexc.NewConnectionError:
        logger.error(f'Cannot open resource on {url} 3')
        return 500
    except ConnectionRefusedError:
        logger.error(f'Cannot open resource on {url} 2')
        return 500
    except requests.exceptions.HTTPError as httperror:
        raise httperror
    directory = stringify(path)
    html_file_name = formatter.format(url)
    logger.info('Connection established\nStarting to load content\n')
    changed_src_html = content.load(url, call.content, directory)
    html_file_path = f'{directory}/{html_file_name}.html'
    with open(html_file_path, 'w+') as content_file:
        content_file.write(changed_src_html)
    return html_file_path
