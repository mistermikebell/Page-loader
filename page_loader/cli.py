import argparse
import os


def get_parse_args():
    description = 'Download webpage and save it as a file'
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('url', type=str)
    parser.add_argument(
        '-o',
        '--output',
        type=str,
        default=os.getcwd(),
        help='Set a directory to save files')
    parser.add_argument(
        '-f',
        '--file',
        type=str,
        default=None,
        help='Set a directory where to save a log file. '
             'If empty then logging will be switched off')
    parser.add_argument(
        '-l',
        '--log-level',
        type=str,
        default='ERROR',
        help='Set a level of logging. Default is ERROR')
    return parser.parse_args()
