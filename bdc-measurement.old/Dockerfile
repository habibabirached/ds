# ARG HTTP_PROXY
# ARG HTTPS_PROXY 
# ARG NO_PROXY

#FROM python:3.12-slim
#FROM debian:bullseye
FROM python:3.10-slim-bullseye

EXPOSE 8000

# Keeps Python from generating .pyc files in the container
ENV PYTHONDONTWRITEBYTECODE=1

# Turns off buffering for easier container logging
ENV PYTHONUNBUFFERED=1

# Install pip requirements
COPY requirements.txt .
RUN python -m pip install -r requirements.txt


WORKDIR /app
COPY /src ./src

# Creates a non-root user and adds permission to access the /app folder
# RUN useradd appuser && chown -R appuser /app
# USER appuser

ENTRYPOINT ["uvicorn", "src.main:app", "--port", "8000", "--host", "0.0.0.0", "--reload"]