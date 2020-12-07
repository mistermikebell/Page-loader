import argparse


def get_parse_args():
    description = 'Download webpage and save it as a file'
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('url', type=str)
    parser.add_argument(
        '-o',
        '--output',
        type=str,
        default='/',
        help='set the directory')
    return parser.parse_args()
