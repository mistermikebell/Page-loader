def create_file(path, content):
    with open(path, 'w+') as content_file:
        content_file.write(content)
