import logging
import requests

from requests import HTTPError
from requests.exceptions import InvalidSchema
from urllib3.exceptions import (MaxRetryError, NewConnectionError,
                                ConnectTimeoutError)


def try_load_url(url):
    try:
        response = requests.get(url)
    except (NewConnectionError, MaxRetryError,
            ConnectTimeoutError, ConnectionRefusedError) as error:
        logging.error(error)
        raise ConnectionError('ConnectionError:', error)
    except InvalidSchema:
        logging.error('InvalidSchema')
        raise InvalidSchema("ConnectionError: Invalid url")
    try:
        response.raise_for_status()
    except Exception:
        logging.error(Exception)
        raise print(f'Status code is {response.status_code}', HTTPError)
    return response
