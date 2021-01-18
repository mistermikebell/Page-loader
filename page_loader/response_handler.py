import requests
import logging

from requests.exceptions import HTTPError, InvalidSchema, ConnectionError
from urllib3.exceptions import (MaxRetryError, NewConnectionError,
                                ConnectTimeoutError, ResponseError)


def try_load_url(url):
    try:
        response = requests.get(url)
        response.raise_for_status()
    except HTTPError:
        logging.error(f'Status code is {response.status_code}')
        raise HTTPError(f'Status code is {response.status_code}')
    return response
