import re

from urllib.parse import urlparse


def build_file_name(url):
    parsed_url = urlparse(url)
    no_scheme_url = parsed_url.netloc + parsed_url.path
    formatted_url = re.sub(r'[^\d\w]+', '-', no_scheme_url)
    return "".join([formatted_url, '.html'])
