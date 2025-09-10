FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install dependencies directly (no virtual env needed in container)
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir uvicorn

# Copy application code
COPY . .

EXPOSE 8000

# Health check - checking if server responds
HEALTHCHECK CMD curl --fail http://localhost:8000/health || exit 1

# Run uvicorn directly since it's in the Python path
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
