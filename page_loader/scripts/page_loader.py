import logging
import sys

from page_loader.cli import get_parsed_args
from page_loader import download
from page_loader.logging import setup


def main():
    args = get_parsed_args()
    setup(log_level=args.log_level, filename=args.file)
    try:
        file_path = download(args.url, args.output)
        print('The webpage had been successfully downloaded to\n', file_path)
    except Exception as e:
        logging.error(str(e))
        logging.debug(e, exc_info=True),
        sys.exit(1)


if __name__ == '__main__':
    main()
