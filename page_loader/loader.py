import logging
import os
from progress.bar import Bar
import requests

from page_loader import url_formatter
from page_loader.resources import process_html
from page_loader import fs
from page_loader import http


def load_resources(path, url, resources):
    dir_name = url_formatter.to_directory_name(url)
    logging.info(f'The directory name is {dir_name}')
    dir_path = os.path.join(path, dir_name)
    fs.create_directory(dir_path)
    with Bar('Processing', max=len(resources)) as bar:
        for resource_url, resource_name in resources.items():
            logging.info(f'load {resource_url}')
            try:
                response = http.get(resource_url)
            except requests.exceptions.RequestException as er:
                logging.warning(er)
                bar.next()
                continue
            fs.create_file(dir_path, resource_name, response.content)
            bar.next()


def download(url, path=os.getcwd()):
    abs_path = os.path.abspath(path)
    fs.check_path(path)
    response = http.get(url)
    logging.debug('Connection established')
    modified_html, resources = process_html(url, response.content)
    html_file_name = url_formatter.to_file_name(url)
    logging.info(f'The HTML file name is {html_file_name}')
    fs.create_file(abs_path, html_file_name, modified_html)
    load_resources(abs_path, url, resources)
    return os.path.join(abs_path, html_file_name)
