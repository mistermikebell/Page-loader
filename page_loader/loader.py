import os
import progressbar

from page_loader import url_formatter
from page_loader.resources import modify_and_get_resources
from page_loader.tools import create_file, create_directory
from page_loader.response_handler import try_load_url


def load_resources(sources, path):
    bar = progressbar.ProgressBar(max_value=len(sources),
                                  redirect_stdout=True).start()
    for source, name in sources.items():
        print(source)
        try:
            response = try_load_url(source)
        except Exception:
            print(f'Cannot open {source}')
            continue
        create_file(path, name, response.content)
    bar.update()


def download(url, path):
    print("Send GET request")
    print(f'\nConnecting to {url} ...\n')
    response = try_load_url(url)
    print('Connection established\n\nStarting to load content\n')

    formatted_url = url_formatter.to_file_name(url)
    resources_directory_name = f'{formatted_url}_files'
    modified_html, resources_list = modify_and_get_resources(
        url, resources_directory_name,
        response.content)
    html_file_name = f'{formatted_url}.html'
    html_file_path = url_formatter.to_directory_name(path, html_file_name)
    create_file(path, html_file_name, modified_html)
    resources_directory_path = create_directory(path,
                                                resources_directory_name)
    load_resources(resources_list, resources_directory_path)
    return os.path.abspath(html_file_path)
