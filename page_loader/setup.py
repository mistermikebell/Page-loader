import logging

FORMAT = '%(asctime)s %(name)s %(levelname)s:%(message)s'


def set_logging():
    logging.basicConfig(filename='debug.log',
                        level=logging.DEBUG,
                        format=FORMAT,
                        )
