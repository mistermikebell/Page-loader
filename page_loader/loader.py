import logging
import os
import progressbar

from page_loader import url_formatter
from page_loader.resources import process_html
from page_loader.fs import create_file, create_directory
from page_loader.connector import do_request


def load_resources(path, url, sources):
    dir_name = url_formatter.to_directory_name(url)
    logging.debug(f'The directory name is {dir_name}')
    dir_path = os.path.join(path, dir_name)
    create_directory(dir_path)
    logging.debug(len(sources))
    bar = progressbar.ProgressBar(max_value=len(sources),
                                  redirect_stdout=True)
    bar_step = 0
    for source, name in sources.items():
        logging.info(f'load {source}')
        try:
            response = do_request(source)
        except Exception as er:
            logging.warning(er)
            bar_step += 1
            continue
        create_file(dir_path, name, response.content)
        bar_step += 1
        bar.update(bar_step)
    bar.finish()


def download(url, path):
    print(f'Send GET request to {url}. The downloading might take time')
    response = do_request(url)
    logging.info('Connection established')
    modified_html, resources = process_html(url, response.content)
    abs_path = os.path.abspath(path)
    html_file_name = url_formatter.to_file_name(url)
    logging.debug(f'The HTML file name is {html_file_name}')
    create_file(abs_path, html_file_name, modified_html.encode())
    load_resources(abs_path, url, resources)
    return os.path.join(abs_path, html_file_name)
