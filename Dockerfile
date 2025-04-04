FROM python:3.12

# ✅ Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

RUN mkdir /app

ADD . /app

WORKDIR /app

RUN pip install -r requirements.txt

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
