import sys

from page_loader.cli import get_parse_args
from page_loader import download
from page_loader.logging import setup


def main():
    args = get_parse_args()
    try:
        file_path = download(args.url, args.output)
        setup(log_level=args.log_level, log_file=args.log_file)
        print('\nHTML file is successfully downloaded to\n', file_path)
    except Exception:
        print("CATCHED EXCEPTION IN SCRIPTS!")
        sys.exit(1)


if __name__ == '__main__':
    main()
