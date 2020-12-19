from page_loader.cli import get_parse_args
from page_loader import load_website


def main():
    args = get_parse_args()
    file_path = load_website(args.url, args.output)
    print('\nHTML file is successfully downloaded to\n',
          file_path)


if __name__ == '__main__':
    main()
