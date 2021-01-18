import logging

FORMAT = '%(asctime)s %(name)s %(levelname)s:%(message)s'


def setup(log_level, **kwargs):
    logging.basicConfig(level=logging.getLevelName(log_level),
                        format=FORMAT,
                        **kwargs
                        )
