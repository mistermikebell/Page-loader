import sys

from page_loader.cli import get_parse_args
from page_loader import download
from page_loader import logging


def main():
    args = get_parse_args()
    logging.setup(log_level='ERROR', filename='tests/debug.log')
    try:
        file_path = download(args.url, args.output)
        print('\nHTML file is successfully downloaded to\n', file_path)
    except Exception:
        sys.exit(1)


if __name__ == '__main__':
    main()
