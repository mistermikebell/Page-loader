import os
import pytest
import tempfile

from os.path import abspath, join
from page_loader import download
from requests.exceptions import HTTPError, ConnectionError
from unittest import mock
from urllib3.exceptions import ConnectTimeoutError

URL = 'https://www.site.com'


def open_and_read(path):
    with open(path) as file_for_read:
        return file_for_read.read()


def get_dir(path):
    files = os.listdir(path)
    dirs = [dir for dir in files if os.path.isdir(os.path.join(path, dir))]
    return os.path.join(path, dirs[0])


def test_load_html(requests_mock):
    sources = {'https://www.site.com':
               './tests/fixtures/input-content.html',
               'https://www.site.com/themes/style.css':
               './tests/fixtures/style.css',
               'https://www.site.com/themes/min.js':
               './tests/fixtures/min.js',
               'http://www.site.com/files/img1.png':
               './tests/fixtures/img1.png'
               }
    for source, content in sources.items():
        requests_mock.get(source, content=open_and_read(content).encode())
    with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
        expected_path = abspath(join(tmpdir, 'www-site-com.html'))
        assert download(URL, tmpdir) == expected_path
        result_files = os.listdir(tmpdir)
        expected_files = os.listdir('./tests/fixtures/result')
        assert result_files == expected_files
        result_dir = get_dir(tmpdir)
        result_files_list = os.listdir(result_dir)
        expected_files_list = os.listdir('./tests/fixtures/result/'
                                         'www-site-com_files')
        assert result_files_list == expected_files_list


@pytest.mark.parametrize('exc', [OSError, PermissionError])
def test_directory_does_not_exist(requests_mock, exc):
    requests_mock.get(URL)
    with mock.patch('page_loader.tools.open') as mocker:
        mocker.side_effect = exc
        with pytest.raises(exc):
            with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
                download(URL, tmpdir)


@pytest.mark.parametrize('status', [404, 500])
def test_status_codes(requests_mock, status):
    requests_mock.get(URL, status_code=status)
    with pytest.raises(HTTPError):
        download(URL, './tests/')


URL_EXCEPTIONS = [ConnectTimeoutError, ConnectionRefusedError]


@pytest.mark.parametrize('exception', URL_EXCEPTIONS)
def test_url_exceptions(requests_mock, exception):
    requests_mock.get(URL, exc=exception)
    with pytest.raises(ConnectionError):
        download(URL, './tests/')
