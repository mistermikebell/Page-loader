import logging
import requests

from requests import HTTPError
from urllib3.exceptions import (MaxRetryError, NewConnectionError,
                                ConnectTimeoutError)


def try_load_url(url):
    try:
        response = requests.get(url)
    except (NewConnectionError, MaxRetryError,
            ConnectTimeoutError, ConnectionRefusedError) as error:
        logging.error(error)
        raise ConnectionError('Cannot connect to url:', error)
    try:
        response.raise_for_status()
    except Exception:
        logging.error(Exception)
        raise HTTPError
    return response
