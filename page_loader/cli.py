import argparse
import os

LOG_LEVELS = ['CRITICAL',
              'ERROR',
              'WARNING',
              'INFO',
              'DEBUG',
              'NOTSET']

DEFAULT_LOG_LEVEL = 'ERROR'


def get_parsed_args():
    description = 'Download webpage and save it as a file'
    parser = argparse.ArgumentParser(description=description)
    parser.add_argument('url', type=str)
    parser.add_argument(
        '-o',
        '--output',
        type=str,
        default=os.getcwd(),
        help='Set a directory to save files. '
             'Default is the current working directory')
    parser.add_argument(
        '-f',
        '--file',
        help='Set a directory where to save a log file.')
    parser.add_argument(
        '-l',
        '--log-level',
        type=str,
        default=DEFAULT_LOG_LEVEL,
        choices=LOG_LEVELS,
        help=f'Set a level of logging. Default is {DEFAULT_LOG_LEVEL}')
    return parser.parse_args()
