def create_systemd_service():
    """Create systemd service for 1Place2Post API."""
    log("Creating systemd service...")
    
    service_content = """[Unit]
Description=1Place2Post API Service
After=network.target

[Service]
Type=simple
User=tonyg
Group=tonyg
WorkingDirectory=/srv/apps/1place2post/api
ExecStart=/usr/bin/npm run start:prod
Restart=always
RestartSec=10s

# Environment
Environment=NODE_ENV=production
Environment=PORT=35763

# Security
PrivateTmp=true
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/apps/1place2post/api

# Logging
StandardOutput=append:/var/log/1place2post/api.log
StandardError=append:/var/log/1place2post/api-error.log

[Install]
WantedBy=multi-user.target
"""
    
    # Check if service already exists
    result = subprocess.run(
        ["systemctl", "list-unit-files", "1place2post-api.service"],
        capture_output=True,
        text=True
    )
    
    if "1place2post-api.service" in result.stdout:
        log("systemd service already exists", YELLOW)
        return True
    
    # Write to temp location
    temp_service = Path("/tmp/1place2post-api.service")
    with open(temp_service, 'w') as f:
        f.write(service_content)
    
    log(f"Service file created: {temp_service}")
    log("\nTo install service:")
    log("1. sudo cp /tmp/1place2post-api.service /etc/systemd/system/")
    log("2. sudo systemctl daemon-reload")
    log("3. sudo systemctl enable 1place2post-api.service")
    log("4. sudo systemctl start 1place2post-api.service")
    log("5. sudo systemctl status 1place2post-api.service")
    
    # Create required directories
    log("\nCreating required directories...")
    directories = [
        "/srv/apps/1place2post/api",
        "/var/log/1place2post"
    ]
    
    for directory in directories:
        result = subprocess.run(
            ["mkdir", "-p", directory],
            capture_output=True,
            text=True
        )
        if result.returncode == 0:
            log(f"Created: {directory}")
        else:
            log(f"Failed to create {directory}: {result.stderr}", YELLOW)
    
    return True
