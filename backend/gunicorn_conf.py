# backend/gunicorn_conf.py
workers = 4
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:8888"
timeout = 120
keepalive = 5