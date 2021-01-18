import requests

from requests.exceptions import HTTPError, InvalidSchema, ConnectionError
from urllib3.exceptions import (MaxRetryError, NewConnectionError,
                                ConnectTimeoutError, ResponseError)


def try_load_url(url):
    try:
        response = requests.get(url)
    except (NewConnectionError, MaxRetryError, ResponseError,
            ConnectTimeoutError, ConnectionRefusedError, ConnectionError):
        raise ConnectionError('ConnectionError')
    except InvalidSchema:
        raise InvalidSchema("ConnectionError: Invalid url")
    try:
        response.raise_for_status()
    except Exception:
        raise HTTPError(f'Status code is {response.status_code}')
    return response
