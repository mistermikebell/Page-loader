from page_loader.cli import get_parse_args
from page_loader import download


def main():
    args = get_parse_args()
    file_path = download(args.url, args.output)
    print(file_path)


if __name__ == '__main__':
    main()