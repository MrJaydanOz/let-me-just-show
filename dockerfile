# Start with this version of python and set the debug buffer to the docker console.
FROM python:3.13-slim
ENV PYTHONBUFFERED=1

# Copy the requirements list and use it to install dependencies.
COPY requirements.txt .
RUN pip3 install -r requirements.txt

# Copy everything else and remove the no longer needed dependancy list.
COPY . .
RUN rm requirements.txt

# Run the python server using the port '8000'.
EXPOSE 8000
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]