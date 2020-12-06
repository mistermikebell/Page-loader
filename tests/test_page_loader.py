import pytest

import tempfile

from page_loader import download

vars_and_results = [('https://ru.hexlet.io/projects/51/members/12259',
                     '/ru-hexlet-io-projects-51-members-12259.html'),
                    ('https://docs.python.org/3/library/urllib.parse.html',
                     '/docs-python-org-3-library-urllib-parse-html.html'),
                    ('https://translate.google.com/?hl=ru&sl=en&tl=uk&text=hello&op=translate',  # noqa: E501
                     '/translate-google-com-.html')]


@pytest.mark.parametrize('url,expected', vars_and_results)
def test_page_loader(url, expected):
    with tempfile.TemporaryDirectory(dir='tmp/') as tmpdir:
        expected_path = tmpdir + expected
        assert download(url, tmpdir) == expected_path
