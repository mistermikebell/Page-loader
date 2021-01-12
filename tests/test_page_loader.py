import os

import pytest

import tempfile

from page_loader import download

vars_and_results = [('https://ru.hexlet.io/projects/51/members/12259',
                     '/ru-hexlet-io-projects-51-members-12259.html'),
                    ('https://docs.python.org/3/library/urllib.parse.html',
                     '/docs-python-org-3-library-urllib-parse-html.html'),
                    ('https://translate.google.com/?hl=ru&sl=en&tl=uk&text=hello&op=translate',  # noqa: E501
                     '/translate-google-com.html')]


@pytest.mark.parametrize('url,expected', vars_and_results)
def test_page_loader(url, expected):
    with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
        expected_path = tmpdir + expected
        assert download(url, tmpdir) == expected_path


url = 'https://www.morganstanley.com/'
html_path = './tests/fixtures/www-morganstanley-com.html'
files_path = './tests/fixtures/www-morganstanley-com_files/'


def open_and_read(path):
    with open(path) as file_for_read:
        return file_for_read.read()


def get_dir(path):
    files = os.listdir(path)
    dirs = [dir for dir in files if os.path.isdir(os.path.join(path, dir))]
    return os.path.join(path, dirs[0])


def test_image_loader():
    with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
        result_html = open_and_read(download(url, tmpdir))
        expected_html = open_and_read(html_path)
        assert result_html == expected_html
        result_dir = get_dir(tmpdir)
        result_files = os.listdir(result_dir)
        expected_files = os.listdir(files_path)
        assert result_files == expected_files
