import requests


def get(url):
    response = requests.get(url)
    response.raise_for_status()
    return response
