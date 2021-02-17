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


SOURCES = [
    ('https://www.site.com',
     './tests/fixtures/input-content.html'),
    ('https://www.site.com/themes/style.css',
     './tests/fixtures/result/www-site-com_files/www-site-com-themes-style.css'),  # noqa: E501
    ('https://www.site.com/themes/min.js',
     './tests/fixtures/result/www-site-com_files/www-site-com-themes-min.js'),
    ('http://www.site.com/files/img1.jpg',
     './tests/fixtures/result/www-site-com_files/www-site-com-files-img1.jpg')]

EXPECTED_DIRECTORY = './tests/fixtures/result/www-site-com_files'


def test_load_html(requests_mock):
    for source, content in SOURCES:
        requests_mock.get(source, content=read_file(content))
    unavlbl_url = "http://www.site.com/files/img3.png"
    requests_mock.get(unavlbl_url, status_code=404)
    with tempfile.TemporaryDirectory(dir='./tests/') as tmpdir:
        actual_path = abspath(join(tmpdir, 'www-site-com.html'))
        assert download(URL, tmpdir) == actual_path
        expected_file = read_file('./tests/fixtures/result/www-site-com.html')
        assert read_file(actual_path) == expected_file
        result_dir = os.path.join(tmpdir, 'www-site-com_files')
        result_files_list = os.listdir(result_dir)
        expected_files_list = os.listdir(EXPECTED_DIRECTORY)
        assert result_files_list == expected_files_list
        for i in range(len(result_files_list)):
            result_content = read_file(os.path.join(result_dir,
                                                    result_files_list[i]))
            expected_content = read_file(os.path.join(EXPECTED_DIRECTORY,
                                                      expected_files_list[i]))
            assert result_content == expected_content



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


FORMATTED_URLS = [('https://www.s--te.com//', 'www-s-te-com.html'),
                  ('https://go_r.org/sth.html', 'go-r-org-sth.html'),
                  ('https://what.net/sfs?df%df12&sd', 'what-net-sfs.html')]


@pytest.mark.parametrize('input, expected_output', FORMATTED_URLS)
def test_url_formatting(input, expected_output):
    result = url_formatter.to_file_name(input)
    assert result == expected_output
