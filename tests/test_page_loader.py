import pytest

from page_loader import download

vars_and_results = [('../tests/fixtures/',
                     'https://ru.hexlet.io/projects/51/members/12259',
                     '../tests/fixtures/ru-hexlet-io-projects-51-members-12259.html'),  # noqa: E501
                    ('../tests/fixtures',
                     'https://docs.python.org/3/library/urllib.parse.html',
                     '../tests/fixtures/docs-python-org-3-library-urllib-parse-html.html'),  # noqa: E501
                    ('fixtures/',
                     'https://translate.google.com/?hl=ru&sl=en&tl=uk&text=hello&op=translate',  # noqa: E501
                     'fixtures/translate-google-com-.html')]


@pytest.mark.parametrize('path,url,expected', vars_and_results)
def test_page_loader(path, url, expected):
    assert download(url, path) == expected
