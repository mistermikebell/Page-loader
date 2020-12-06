install:
	@poetry install

test: 
	poetry run pytest --cov=page_loader tests/ --cov-report xml

lint:
	poetry run flake8 page_loader

selfcheck:
	poetry check

check: selfcheck test lint

.PHONY: install test lint selfcheck check build

build: poetry build

package-install:
    pip install --user dist/*.whl
