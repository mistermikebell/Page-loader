import os
import pytest
import tempfile

from os.path import abspath, join
from page_loader import download, url_formatter
from requests.exceptions import HTTPError

URL = 'https://www.site.com'


def read_file(path):
    with open(path, mode='rb') as file_for_read:
        return file_for_read.read()


def get_dir(path):
    files = os.listdir(path)
    dirs = [dir for dir in files if os.path.isdir(os.path.join(path, dir))]
    return os.path.join(path, dirs[0])


SOURCES = {
    'https://www.site.com':
    './tests/fixtures/input-content.html',
    'https://www.site.com/themes/style.css':
    './tests/fixtures/result/www-site-com_files/www-site-com-themes-style.css',
    'https://www.site.com/themes/min.js':
    './tests/fixtures/result/www-site-com_files/www-site-com-themes-min.js',
    'http://www.site.com/files/img1.png':
    './tests/fixtures/result/www-site-com_files/www-site-com-files-img1.png'}


def test_load_html(requests_mock):
    for source, content in SOURCES.items():
        requests_mock.get(source, content=read_file(content))
    unavlbl_url = "http://www.site.com/files/img3.png"
    requests_mock.get(unavlbl_url, content=read_file(content), status_code=404)
    with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
        expected_path = abspath(join(tmpdir, 'www-site-com.html'))
        assert download(URL, tmpdir) == expected_path
        expected_file = read_file('./tests/fixtures/result/www-site-com.html')
        assert read_file(expected_path) == expected_file
        result_files = os.listdir(tmpdir)
        expected_files = os.listdir('./tests/fixtures/result')
        assert result_files == expected_files
        result_dir = get_dir(tmpdir)
        result_files_list = os.listdir(result_dir)
        expected_files_list = os.listdir('./tests/fixtures/result/'
                                         'www-site-com_files')
        assert result_files_list == expected_files_list


def test_io_errors():
    with pytest.raises(NotADirectoryError):
        download(URL, './tests/__init__.py')
    with pytest.raises(FileNotFoundError):
        download(URL, 'non_existing_path/')
    with pytest.raises(PermissionError):
        download(URL, '/sys')


@pytest.mark.parametrize('status', [404, 500])
def test_response_errors(requests_mock, status):
    requests_mock.get(URL, status_code=status)
    with pytest.raises(HTTPError):
        download(URL, './tests/')


FORMATTED_URLS = {'https://www.s--te.com//': 'www-s-te-com.html',
                  'https://go_r.org/sth.html': 'go-r-org-sth.html',
                  'https://what.net/sfs?df%df12&sd': 'what-net-sfs.html'}


@pytest.mark.parametrize('input, expected_output', FORMATTED_URLS.items())
def test_url_formatting(input, expected_output):
    result = url_formatter.to_file_name(input)
    assert result == expected_output
