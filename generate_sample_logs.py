#!/usr/bin/env python3
"""
Sample log data generator for Victoria Logs
Generates realistic application logs with various log levels and patterns
"""

import json
import random
import time
import requests
from datetime import datetime, timedelta
import threading
import sys

# Sample applications and services
SERVICES = [
    "web-server", "api-gateway", "user-service", "payment-service", 
    "notification-service", "database", "cache-service", "auth-service",
    "order-service", "inventory-service", "analytics-service", 
    "email-service", "file-storage", "cdn-service", "monitoring-service",
    "backup-service", "search-service", "recommendation-engine",
    "fraud-detection", "reporting-service", "webhook-handler",
    "scheduler-service", "image-processor", "video-transcoder"
]

# Sample log levels
LOG_LEVELS = ["DEBUG", "INFO", "WARN", "ERROR", "FATAL"]

# Sample log messages
LOG_MESSAGES = {
    "DEBUG": [
        "Processing request for user {user_id}",
        "Cache hit for key {cache_key}",
        "Database query executed in {duration}ms",
        "Validating input parameters",
        "Starting background task {task_id}",
        "Parsing JSON payload with {size} bytes",
        "Connecting to external API endpoint",
        "Loading configuration from {config_file}",
        "Initializing connection pool with {pool_size} connections",
        "Garbage collection completed in {gc_time}ms"
    ],
    "INFO": [
        "User {user_id} logged in successfully",
        "Order {order_id} created successfully",
        "Payment processed for amount ${amount}",
        "Email sent to {email}",
        "Service started on port {port}",
        "Health check passed",
        "Request completed in {duration}ms",
        "File uploaded: {filename} ({file_size} bytes)",
        "Scheduled job {job_name} completed successfully",
        "API endpoint /api/v1/{endpoint} responded with 200",
        "Session created for user {user_id}",
        "Product {product_id} added to inventory",
        "Webhook {webhook_id} delivered successfully",
        "Search query executed: '{search_term}' ({result_count} results)"
    ],
    "WARN": [
        "High memory usage detected: {memory_usage}%",
        "Slow query detected: {duration}ms",
        "Rate limit approaching for user {user_id}",
        "Cache miss for key {cache_key}",
        "Retry attempt {attempt} for operation {operation}",
        "Disk space running low: {disk_usage}% used",
        "Connection pool near capacity: {active_connections}/{max_connections}",
        "Deprecated API endpoint called: /api/v1/{endpoint}",
        "High CPU usage: {cpu_usage}% for the last {time_window} minutes",
        "Large response size: {response_size} bytes for request {request_id}"
    ],
    "ERROR": [
        "Failed to connect to database: {error}",
        "Payment failed for order {order_id}: {error}",
        "Authentication failed for user {user_id}",
        "Service unavailable: {service}",
        "Timeout occurred while processing request {request_id}",
        "Failed to send email to {email}: {error}",
        "Image processing failed for file {filename}",
        "External API call failed: {api_endpoint} returned {status_code}",
        "File upload failed: {filename} - {error}",
        "Database transaction rolled back: {transaction_id}",
        "Webhook delivery failed: {webhook_url} - {error}",
        "Cache invalidation failed for key {cache_key}"
    ],
    "FATAL": [
        "Database connection pool exhausted",
        "Out of memory error",
        "Critical service failure: {service}",
        "Security breach detected",
        "System shutdown initiated",
        "Disk space critically low: {disk_space} remaining",
        "Service crashed with exit code {exit_code}",
        "Load balancer health check failed for all instances",
        "Critical configuration error: {config_error}",
        "Database corruption detected in table {table_name}"
    ]
}

# Sample data for message formatting
SAMPLE_DATA = {
    "user_id": lambda: f"user_{random.randint(1000, 9999)}",
    "order_id": lambda: f"ord_{random.randint(100000, 999999)}",
    "cache_key": lambda: f"cache_{random.choice(['user', 'product', 'session'])}_{random.randint(1, 1000)}",
    "duration": lambda: random.randint(10, 5000),
    "amount": lambda: round(random.uniform(10.0, 1000.0), 2),
    "email": lambda: f"user{random.randint(1, 1000)}@example.com",
    "port": lambda: random.choice([8080, 8081, 8082, 9000, 9001]),
    "memory_usage": lambda: random.randint(70, 95),
    "attempt": lambda: random.randint(1, 5),
    "operation": lambda: random.choice(["payment", "login", "data_sync", "backup"]),
    "error": lambda: random.choice(["Connection timeout", "Invalid credentials", "Service unavailable", "Rate limit exceeded"]),
    "service": lambda: random.choice(SERVICES),
    "request_id": lambda: f"req_{random.randint(100000, 999999)}",
    "task_id": lambda: f"task_{random.randint(1000, 9999)}",
    "size": lambda: random.randint(1024, 1048576),
    "config_file": lambda: random.choice(["app.yaml", "database.conf", "redis.conf", "nginx.conf"]),
    "pool_size": lambda: random.randint(10, 100),
    "gc_time": lambda: random.randint(5, 200),
    "filename": lambda: f"{random.choice(['image', 'document', 'video', 'data'])}_{random.randint(1000, 9999)}.{random.choice(['jpg', 'pdf', 'mp4', 'csv'])}",
    "file_size": lambda: random.randint(1024, 10485760),
    "job_name": lambda: random.choice(["backup", "cleanup", "report", "sync", "index"]),
    "endpoint": lambda: random.choice(["users", "orders", "products", "payments", "analytics"]),
    "product_id": lambda: f"prod_{random.randint(10000, 99999)}",
    "webhook_id": lambda: f"wh_{random.randint(100000, 999999)}",
    "search_term": lambda: random.choice(["laptop", "phone", "book", "shoes", "headphones"]),
    "result_count": lambda: random.randint(0, 1000),
    "disk_usage": lambda: random.randint(80, 99),
    "active_connections": lambda: random.randint(80, 95),
    "max_connections": lambda: 100,
    "cpu_usage": lambda: random.randint(75, 99),
    "time_window": lambda: random.randint(5, 30),
    "response_size": lambda: random.randint(1048576, 10485760),
    "status_code": lambda: random.choice([400, 401, 403, 404, 500, 502, 503, 504]),
    "api_endpoint": lambda: f"https://api.{random.choice(['payment', 'shipping', 'inventory'])}.com/v1/{random.choice(['status', 'data', 'sync'])}",
    "transaction_id": lambda: f"txn_{random.randint(1000000, 9999999)}",
    "webhook_url": lambda: f"https://{random.choice(['client1', 'client2', 'partner'])}.com/webhook/{random.randint(1000, 9999)}",
    "disk_space": lambda: f"{random.randint(100, 500)}MB",
    "exit_code": lambda: random.choice([1, 2, 127, 130, 137]),
    "config_error": lambda: random.choice(["Invalid JSON", "Missing required field", "Invalid port number", "File not found"]),
    "table_name": lambda: random.choice(["users", "orders", "products", "payments", "sessions"])
}

def generate_log_entry():
    """Generate a single log entry"""
    service = random.choice(SERVICES)
    level = random.choice(LOG_LEVELS)
    
    # Weight log levels (more INFO/DEBUG, fewer ERROR/FATAL)
    weights = {"DEBUG": 0.3, "INFO": 0.4, "WARN": 0.2, "ERROR": 0.08, "FATAL": 0.02}
    level = random.choices(list(weights.keys()), weights=list(weights.values()))[0]
    
    message_template = random.choice(LOG_MESSAGES[level])
    
    # Replace placeholders in message
    message = message_template
    for key, generator in SAMPLE_DATA.items():
        if f"{{{key}}}" in message:
            message = message.replace(f"{{{key}}}", str(generator()))
    
    # Generate timestamp (recent logs)
    now = datetime.now()
    timestamp = now - timedelta(seconds=random.randint(0, 3600))  # Last hour
    
    log_entry = {
        "_time": timestamp.isoformat() + "Z",
        "_msg": message,
        "level": level,
        "service": service,
        "host": f"host-{random.randint(1, 10)}",
        "environment": random.choice(["production", "staging", "development"]),
        "version": f"v{random.randint(1, 3)}.{random.randint(0, 9)}.{random.randint(0, 9)}",
        "request_id": f"req_{random.randint(100000, 999999)}",
        "user_agent": random.choice([
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "curl/7.68.0",
            "PostmanRuntime/7.28.4",
            "python-requests/2.25.1"
        ])
    }
    
    return log_entry

def send_logs_to_victoria(logs, batch_size=100):
    """Send logs to Victoria Logs via HTTP API"""
    url = "http://localhost:9428/insert/jsonline"
    
    for i in range(0, len(logs), batch_size):
        batch = logs[i:i + batch_size]
        
        # Convert to JSONL format
        jsonl_data = "\n".join(json.dumps(log) for log in batch)
        
        try:
            response = requests.post(
                url,
                data=jsonl_data,
                headers={"Content-Type": "application/x-ndjson"},
                timeout=10
            )
            
            if response.status_code == 200:
                print(f"✓ Sent batch of {len(batch)} logs")
            else:
                print(f"✗ Failed to send batch: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"✗ Error sending logs: {e}")
        
        time.sleep(0.1)  # Small delay between batches

def generate_historical_logs(count=1000):
    """Generate historical log data"""
    print(f"Generating {count} historical log entries...")
    logs = []
    
    for i in range(count):
        log_entry = generate_log_entry()
        # Make historical logs span last 24 hours
        now = datetime.now()
        timestamp = now - timedelta(seconds=random.randint(0, 86400))  # Last 24 hours
        log_entry["_time"] = timestamp.isoformat() + "Z"
        logs.append(log_entry)
        
        if (i + 1) % 100 == 0:
            print(f"Generated {i + 1}/{count} logs...")
    
    print("Sending historical logs to Victoria Logs...")
    send_logs_to_victoria(logs)
    print("Historical logs sent successfully!")

def generate_realtime_logs(duration_seconds=300):
    """Generate real-time log data"""
    print(f"Generating real-time logs for {duration_seconds} seconds...")
    start_time = time.time()
    
    while time.time() - start_time < duration_seconds:
        # Generate 1-5 logs per second
        num_logs = random.randint(1, 5)
        logs = []
        
        for _ in range(num_logs):
            log_entry = generate_log_entry()
            # Use current time for real-time logs
            log_entry["_time"] = datetime.now().isoformat() + "Z"
            logs.append(log_entry)
        
        send_logs_to_victoria(logs)
        time.sleep(1)  # Wait 1 second
    
    print("Real-time log generation completed!")

if __name__ == "__main__":
    print("Victoria Logs Sample Data Generator")
    print("=" * 40)
    
    # Check if Victoria Logs is running
    try:
        response = requests.get("http://localhost:9428/", timeout=5)
        print("✓ Victoria Logs is running")
    except Exception as e:
        print(f"✗ Cannot connect to Victoria Logs: {e}")
        print("Please ensure Victoria Logs is running on localhost:9428")
        sys.exit(1)
    
    # Generate more historical data for a richer dataset
    generate_historical_logs(5000)
    
    # Generate some real-time data
    print("\nStarting real-time log generation...")
    print("Press Ctrl+C to stop")
    
    try:
        generate_realtime_logs(300)  # Generate for 5 minutes
    except KeyboardInterrupt:
        print("\nReal-time generation stopped by user")
    
    print("\nSample data generation completed!")
    print("You can now query the logs at: http://localhost:9428/select/vmui")
