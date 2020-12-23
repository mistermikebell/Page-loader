import sys

from page_loader.cli import get_parse_args
from page_loader import download


def main():
    args = get_parse_args()
    try:
        file_path = download(args.url, args.output)
        print('\nHTML file is successfully downloaded to\n',
              file_path)
        sys.exit()
    except:
        sys.exit('1')


if __name__ == '__main__':
    main()
