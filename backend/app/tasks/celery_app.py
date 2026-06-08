from celery import Celery
from celery.schedules import crontab
from app.core.config import settings

celery_app = Celery(
    "brandwtch",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.monitor_tasks", "app.tasks.alert_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.tasks.monitor_tasks.*": {"queue": "monitoring"},
        "app.tasks.alert_tasks.*": {"queue": "alerts"},
    },
    beat_schedule={
        "crawl-all-brands-hourly": {
            "task": "app.tasks.monitor_tasks.crawl_all_brands",
            "schedule": crontab(minute=0),
        },
        "check-alerts-every-15min": {
            "task": "app.tasks.alert_tasks.check_all_alerts",
            "schedule": crontab(minute="*/15"),
        },
    },
)
