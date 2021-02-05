import os

from bs4 import BeautifulSoup
from page_loader import url_formatter
from urllib.parse import urljoin
from urllib.parse import urlparse


TAG_ATTRIBUTES = {'img': 'src',
                  'link': 'href',
                  'script': 'src'}


def process_html(url, content):
    dir_name = url_formatter.to_directory_name(url)
    soup = BeautifulSoup(content, features="html.parser")
    sources = {}
    for tag in soup.find_all(TAG_ATTRIBUTES.keys()):
        attribute = TAG_ATTRIBUTES[tag.name]
        source = tag.get(attribute)
        if not source:
            continue
        source = urljoin(url, source)
        if urlparse(url).netloc != urlparse(source).netloc:
            continue
        file_name = url_formatter.to_file_name(source)
        sources[source] = file_name
        tag[attribute] = os.path.join(dir_name, file_name)
    return soup.prettify(formatter='html5'), sources
