import requests


def do_request(url):
    response = requests.get(url)
    response.raise_for_status()
    return response
