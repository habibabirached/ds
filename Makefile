
BRANCH?=master

need_update:
    git fetch
    if [ `git rev-list HEAD...origin/${BRANCH} --count` -eq '0' ]; then \
        echo "No updates, aborting build!\n"; \
        exit 1; \
    fi

fetch:
    git pull

build:
    docker-compose build

restart:
    docker-compose down
    docker-compose up -d

upgrade: need_update fetch build restart