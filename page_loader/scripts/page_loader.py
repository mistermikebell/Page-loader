import sys
import logging

from page_loader.cli import get_parse_args
from page_loader import download
from page_loader.logging import setup


def main():
    args = get_parse_args()
    setup(log_level='DEBUG')
    try:
        file_path = download(args.url, args.output)
        print('\nHTML file is successfully downloaded to\n', file_path)
    except Exception as e:
        logging.error(str(e))
        sys.exit(1)


if __name__ == '__main__':
    main()
