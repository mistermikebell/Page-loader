install:
	@poetry install

test: 
	poetry run pytest --cov=page_loader tests/ --cov-report xml

lint:
	poetry run flake8 page_loader

package-install:
	pip install --user dist/*.whl

build:
	poetry build

selfcheck:
	poetry check

check: selfcheck test lint

.PHONY: install test lint selfcheck check build
