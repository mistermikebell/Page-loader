import logging
import sys

from page_loader.cli import get_parse_args
from page_loader import download

logger = logging.getLogger(__name__)

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.INFO)
stream_handler.setFormatter(logging.Formatter('%(message)s'))

logger.addHandler(stream_handler)


def main():
    args = get_parse_args()
    file_path = download(args.url, args.output)
    logger.info('\nHTML file is successfully downloaded to\n',
                file_path)
    sys.exit()


if __name__ == '__main__':
    main()
