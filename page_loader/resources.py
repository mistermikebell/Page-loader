from urllib.parse import urljoin
from bs4 import BeautifulSoup
from page_loader import url_formatter
from urllib.parse import urlparse


def modify_and_get_resources(url, path, content):
    soup = BeautifulSoup(content, features="html.parser")
    sources = {}
    for tag in soup.find_all(['img', 'link', 'script']):
        if tag.name == 'link':
            attribute = 'href'
            source = tag.get(attribute)
        else:
            attribute = 'src'
            source = tag.get(attribute)
        if not source:
            continue
        if not urlparse(source).netloc:
            source.strip('/')
            source = urljoin(url, source)
        if urlparse(url).netloc != urlparse(source).netloc:
            continue
        formatted_name = url_formatter.to_file_name_with_extension(source)
        sources[source] = formatted_name
        tag[attribute] = url_formatter.to_directory_name(path, formatted_name)
    return soup.prettify(formatter='html5').encode(), sources
