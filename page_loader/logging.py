import logging

FORMAT = '%(asctime)s %(name)s %(levelname)s:%(message)s'


def setup(log_level=3, log_file="no file"):
    if log_file == "no file":
        return None
    logging.basicConfig(filename=log_file,
                        level=log_level,
                        format=FORMAT,
                        )
