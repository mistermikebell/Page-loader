import os
import tempfile
from bs4 import BeautifulSoup
import requests
from page_loader.loader import download

url = 'https://www.federalreserve.gov/aboutthefed/contact-us-topics.htm'


download(url, 'tmp/')