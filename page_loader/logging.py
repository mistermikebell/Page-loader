import logging

FORMAT = '%(asctime)s %(name)s %(levelname)s:%(message)s'


def setup(log_level, **kwargs):
    logging.basicConfig(level=logging.getLevelName(log_level),
                        format=FORMAT,
                        **kwargs
                        )


console = logging.StreamHandler()
console.setLevel(logging.ERROR)
formatter = logging.Formatter('%(message)s')
console.setFormatter(formatter)
logging.getLogger("").addHandler(console)
