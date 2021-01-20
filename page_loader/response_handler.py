import requests
import logging

from requests.exceptions import HTTPError, InvalidSchema, ConnectionError
from urllib3.exceptions import (MaxRetryError, NewConnectionError,
                                ConnectTimeoutError, ResponseError)


def try_load_url(url):
    logging.info('TRY LOAD URL')
    try:
        response = requests.get(url)
    except (NewConnectionError, MaxRetryError, ResponseError,
            ConnectTimeoutError, ConnectionRefusedError, ConnectionError):
        logging.error(f'ConnectionError: cannot connect to {url}')
        raise ConnectionError
    except InvalidSchema:
        logging.error('ConnectionError: Invalid url')
        raise InvalidSchema
    try:
        response.raise_for_status()
    except HTTPError:
        logging.error(f'Cannot open {url}.'
                      f'Status code is {response.status_code}')
        raise HTTPError
    return response
