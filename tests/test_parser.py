from page_loader import download
import os
import tempfile

url = 'https://www.federalreserve.gov/aboutthefed/contact-us-topics.htm'

download(url, 'fixtures/')