import argparse

import os


def get_parse_args():
    parser = argparse.ArgumentParser(description='Download webpage')
    parser.add_argument('url', type=str)
    parser.add_argument(
        '-o',
        '--output',
        type=str,
        default=os.getcwd(),
        help='Set the directory to download the page content')
    return parser.parse_args()
