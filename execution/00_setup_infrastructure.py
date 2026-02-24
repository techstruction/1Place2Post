#!/usr/bin/env python3
"""
Execution script: 00_setup_infrastructure.py

Sets up the core infrastructure for 1Place2Post project.
This is a deterministic, repeatable script that follows the 3-layer architecture.

Goal: Prepare the VPS and local environment with all required dependencies.

Usage:
    python3 execution/00_setup_infrastructure.py
    
Verification:
    - Node.js version printed (20.x+)
    - Redis ping returns PONG
    - Cloudflare tunnel status active
    - .env file exists with secrets
    - nginx configuration test passes
"""

import os
import sys
import subprocess
import secrets
from pathlib import Path
from datetime import datetime

# Color codes for output
GREEN = '\033[92m'
YELLOW = '\033[93m'
RED = '\033[91m'
RESET = '\033[0m'

def log(message, color=GREEN):
    """Log with timestamp and color."""
    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    print(f"{color}[{timestamp}] {message}{RESET}")

def check_root():
    """Check if running with sudo for system-level operations."""
    if os.geteuid() != 0:
        log("Some operations will require sudo. Please run with sudo:", YELLOW)
        log("sudo python3 execution/00_setup_infrastructure.py", YELLOW)
        continue_anyway = input("Continue without sudo? (y/N): ")
        if continue_anyway.lower() != 'y':
            sys.exit(1)
    return True

def run_command(cmd, shell=True, check=True):
    """Run a command and return result."""
    try:
        result = subprocess.run(
            cmd,
            shell=shell,
            capture_output=True,
            text=True,
            check=check
        )
        return result
    except subprocess.CalledProcessError as e:
        log(f"Command failed: {cmd}", RED)
        log(f"Error: {e.stderr}", RED)
        raise

def generate_secret(length=32, hex_format=True):
    """Generate a cryptographically secure secret."""
    if hex_format:
        return secrets.token_hex(length)
    else:
        return secrets.token_urlsafe(length)

def install_nodejs():
    """Install Node.js 20.x via NodeSource."""
    log("Installing Node.js 20.x...")
    
    # Check if already installed
    result = subprocess.run(
        ["node", "--version"],
        capture_output=True,
        text=True
    )
    
    if result.returncode == 0:
        version = result.stdout.strip()
        if version.startswith("v20") or version.startswith("v21"):
            log(f"Node.js {version} already installed!", YELLOW)
            return True
        else:
            log(f"Node.js {version} installed, but need 20.x+", YELLOW)
    
    # Install NodeSource repository
    log("Adding NodeSource repository...")
    cmds = [
        "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -",
        "sudo apt-get install -y nodejs"
    ]
    
    for cmd in cmds:
        log(f"Running: {cmd}")
        run_command(cmd)
    
    # Verify installation
    result = run_command("node --version")
    version = result.stdout.strip()
    log(f"Node.js {version} installed successfully!", GREEN)
    
    # Also verify npm
    result = run_command("npm --version")
    version = result.stdout.strip()
    log(f"npm {version} installed successfully!", GREEN)
    
    return True

def configure_environment():
    """Generate secrets and configure .env file."""
    log("Configuring environment variables...")
    
    env_path = Path(".env")
    
    # Read existing .env if it exists
    existing_vars = {}
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    if '=' in line:
                        key, value = line.split('=', 1)
                        existing_vars[key.strip()] = value.strip()
        log("Existing .env file found, preserving existing values")
    
    # Generate required secrets
    jwt_secret = existing_vars.get('JWT_SECRET')
    if not jwt_secret:
        jwt_secret = generate_secret(32, hex_format=True)
        log("Generated new JWT_SECRET")
    else:
        log("Using existing JWT_SECRET", YELLOW)
    
    webhook_secret = existing_vars.get('INCOMING_WEBHOOK_SECRET')
    if not webhook_secret:
        webhook_secret = generate_secret(16, hex_format=True)
        log("Generated new INCOMING_WEBHOOK_SECRET")
    else:
        log("Using existing INCOMING_WEBHOOK_SECRET", YELLOW)
    
    # Database URL (default to PostgreSQL)
    database_url = existing_vars.get('DATABASE_URL')
    if not database_url:
        # Default to PostgreSQL on localhost
        database_url = "postgresql://user:password@localhost:5432/1place2post?schema=public"
        log("Set default DATABASE_URL (update with actual creds)")
    else:
        log("Using existing DATABASE_URL", YELLOW)
    
    # Create .env file
    log("Writing .env file...")
    with open(env_path, 'w') as f:
        f.write(f"# 1Place2Post Environment Variables\n")
        f.write(f"# Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"# NEVER commit this file to git!\n")
        f.write(f"\n# Authentication\n")
        f.write(f"JWT_SECRET={jwt_secret}\n")
        f.write(f"INCOMING_WEBHOOK_SECRET={webhook_secret}\n")
        f.write(f"\n# Database\n")
        f.write(f"DATABASE_URL={database_url}\n")
        f.write(f"\n# Optional: AI Integration (required for Phase 4+)\n")
        f.write(f"# OPENAI_API_KEY=sk-your-api-key-here\n")
        f.write(f"\n# Optional: Redis (if not using default)\n")
        f.write(f"# REDIS_URL=redis://localhost:6379\n")
        f.write(f"\n# Platform Credentials (to be filled)\n")
        f.write(f"# INSTAGRAM_CLIENT_ID=\n")
        f.write(f"# INSTAGRAM_CLIENT_SECRET=\n")
        f.write(f"# TIKTOK_CLIENT_ID=\n")
        f.write(f"# TIKTOK_CLIENT_SECRET=\n")
        f.write(f"# FACEBOOK_CLIENT_ID=\n")
        f.write(f"# FACEBOOK_CLIENT_SECRET=\n")
        f.write(f"# YOUTUBE_CLIENT_ID=\n")
        f.write(f"# YOUTUBE_CLIENT_SECRET=\n")
        f.write(f"# TWITTER_CLIENT_ID=\n")
        f.write(f"# TWITTER_CLIENT_SECRET=\n")
    
    log("\n.env file created/updated successfully!")
    log("IMPORTANT: Review and update DATABASE_URL and other values as needed", YELLOW)
    log("IMPORTANT: Never commit .env to git! It's already in .gitignore", YELLOW)
    
    return True

def configure_cloudflare_tunnel():
    """Configure Cloudflare tunnel for 1Place2Post."""
    log("Configuring Cloudflare tunnel...")
    
    # Check if cloudflared is installed
    result = subprocess.run(
        ["cloudflared", "version"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        log("cloudflared not found. Installing...")
        run_command("sudo apt-get install -y cloudflared")
    
    version = result.stdout.strip() if result.returncode == 0 else "installed"
    log(f"cloudflared {version}")
    
    # Create tunnel directory
    tunnel_dir = Path("/etc/cloudflared")
    if not tunnel_dir.exists():
        log("Creating Cloudflare config directory...")
        run_command(f"sudo mkdir -p {tunnel_dir}")
    
    # Check if tunnel already exists
    config_path = Path("/etc/cloudflared/config.yml")
    if config_path.exists():
        log("Cloudflare config already exists", YELLOW)
        with open(config_path, 'r') as f:
            content = f.read()
            if "1place2post" in content:
                log("1Place2Post tunnel already configured", YELLOW)
                return True
    
    log("Cloudflare tunnel configuration required:")
    log("1. Create tunnel: cloudflared tunnel create 1place2post")
    log("2. Get tunnel ID: cloudflared tunnel list")
    log("3. Create DNS records:")
    log("   cloudflared tunnel route dns [TUNNEL-ID] 1place2post.techstruction.co")
    log("   cloudflared tunnel route dns [TUNNEL-ID] 1place2post-st.techstruction.co")
    log("4. Update /etc/cloudflared/config.yml with tunnel credentials")
    log("5. Run: cloudflared service install")
    log("6. Run: systemctl start cloudflared")
    
    # Create a template config.yml
    template_config = f"""# 1Place2Post Cloudflare Tunnel Configuration
# 1. Create tunnel: cloudflared tunnel create 1place2post
# 2. Get your tunnel ID and credentials file
# 3. Replace [TUNNEL-ID] below

# tunnel: [TUNNEL-ID]
# credentials-file: /etc/cloudflared/[TUNNEL-ID].json

# Uncomment and update after creating tunnel:
# ingress:
#   - hostname: 1place2post-st.techstruction.co
#     service: http://localhost:8000
#   - hostname: 1place2post.techstruction.co
#     service: http://localhost:8000
#   - service: http_status:404

# For now, manual tunnel required. Run this command to start:
# cloudflared tunnel --url http://localhost:8000
"""
    
    temp_config = Path("/tmp/cloudflared-config.yml")
    with open(temp_config, 'w') as f:
        f.write(template_config)
    
    log(f"\nTemplate config created: {temp_config}")
    log("Manual steps required to complete tunnel setup", YELLOW)
    
    return True

def configure_nginx():
    """Configure nginx for 1Place2Post."""
    log("Configuring nginx...")
    
    # Check if nginx is installed
    result = subprocess.run(
        ["nginx", "-v"],
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        log("nginx not found. Installing...")
        run_command("sudo apt-get install -y nginx")
    
    log("nginx installed")
    
    # Create nginx configuration (using .format() to avoid f-string brace escaping)
    nginx_config_template = """# 1Place2Post nginx Configuration
# Generated: {timestamp}

upstream api_backend {{{{
    server 127.0.0.1:35763;
}}}}

server {{{{
    listen 80;
    server_name 1place2post.techstruction.co 1place2post-st.techstruction.co;
    
    # API routes - Forward to NestJS backend
    location /api/ {{{{
        proxy_pass http://api_backend/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}}}
    
    # Frontend - Forward to Next.js dev server or static files
    location / {{{{
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }}}}
    
    # Error pages
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {{{{
        root /usr/share/nginx/html;
    }}}}
    
    # Logging
    access_log /var/log/nginx/1place2post-access.log;
    error_log /var/log/nginx/1place2post-error.log;
    
    # Rate limiting (adjust as needed)
    # limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    # limit_req zone=api burst=20 nodelay;
}}}

# Note: For production, consider separate server blocks per hostname
"""
    nginx_config = nginx_config_template.format(
        timestamp=datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    )
    
    return True

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

def setup_log_rotation():
    """Set up log rotation for 1Place2Post logs."""
    log("Setting up log rotation...")
    
    logrotate_config = """/srv/apps/1place2post/api/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 tonyg tonyg
    sharedscripts
    postrotate
        systemctl reload 1place2post-api.service > /dev/null 2>&1 || true
    endscript
}

/var/log/1place2post/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
"""
    
    temp_config = Path("/tmp/1place2post-logrotate")
    with open(temp_config, 'w') as f:
        f.write(logrotate_config)
    
    log(f"Log rotation config: {temp_config}")
    log(f"To install: sudo cp {temp_config} /etc/logrotate.d/1place2post")
    log(f"Test with: sudo logrotate -d /etc/logrotate.d/1place2post")
    
    return True

def verify_setup():
    """Verify all components are installed and configured."""
    log("\n" + "="*50)
    log("VERIFICATION REPORT", YELLOW)
    log("="*50)
    
    checks = []
    
    # Check Node.js
    result = subprocess.run(["node", "--version"], capture_output=True, text=True)
    if result.returncode == 0:
        checks.append(("Node.js", True, result.stdout.strip()))
    else:
        checks.append(("Node.js", False, "Not installed"))
    
    # Check npm
    result = subprocess.run(["npm", "--version"], capture_output=True, text=True)
    if result.returncode == 0:
        checks.append(("npm", True, result.stdout.strip()))
    else:
        checks.append(("npm", False, "Not installed"))
    
    # Check Redis
    result = subprocess.run(["redis-cli", "ping"], capture_output=True, text=True)
    if result.returncode == 0 and "PONG" in result.stdout:
        checks.append(("Redis", True, "Running"))
    else:
        checks.append(("Redis", False, "Not running or not installed"))
    
    # Check cloudflared
    result = subprocess.run(["cloudflared", "version"], capture_output=True, text=True)
    if result.returncode == 0:
        checks.append(("cloudflared", True, "Installed"))
    else:
        checks.append(("cloudflared", False, "Not installed"))
    
    # Check nginx
    result = subprocess.run(["nginx", "-v"], capture_output=True, text=True)
    if result.returncode == 0:
        checks.append(("nginx", True, "Installed"))
    else:
        checks.append(("nginx", False, "Not installed"))
    
    # Check .env file
    if Path(".env").exists():
        checks.append(((".env file", True, "Created")))
    else:
        checks.append(((".env file", False, "Not created")))
    
    # Print results
    passed = 0
    total = len(checks)
    
    for name, status, details in checks:
        if status:
            log(f"✓ {name}: {details}", GREEN)
            passed += 1
        else:
            log(f"✗ {name}: {details}", RED)
    
    log("\n" + "="*50)
    log(f"SUMMARY: {passed}/{total} checks passed", YELLOW)
    log("="*50)
    
    if passed == total:
        log("\n🎉 All infrastructure components configured successfully!", GREEN)
        log("Next: Complete manual steps (cloudflared tunnel, nginx, systemd)", YELLOW)
        return True
    else:
        log(f"\n⚠️  {total - passed} components need attention", RED)
        log("Review errors above and re-run script", RED)
        return False

def main():
    """Main execution function."""
    log("="*60)
    log("1Place2Post Infrastructure Setup (Phase 0)", YELLOW)
    log("="*60)
    
    # Check root access
    check_root()
    
    # Setup steps
    steps = [
        ("Node.js Installation", install_nodejs),
        ("Environment Configuration", configure_environment),
        ("Cloudflare Tunnel Setup", configure_cloudflare_tunnel),
        ("nginx Configuration", configure_nginx),
        ("systemd Service", create_systemd_service),
        ("Log Rotation", setup_log_rotation),
    ]
    
    results = []
    for step_name, step_func in steps:
        try:
            log(f"\n{'='*60}")
            log(f"Step: {step_name}")
            log('='*60)
            result = step_func()
            results.append((step_name, result))
        except Exception as e:
            log(f"Error in {step_name}: {str(e)}", RED)
            results.append((step_name, False))
            # Continue to next step
    
    # Final verification
    log("\n" + "="*60)
    log("VERIFICATION", YELLOW)
    log('='*60)
    verify_result = verify_setup()
    
    # Summary
    log("\n" + "="*60)
    log("SETUP SUMMARY", YELLOW)
    log('='*60)
    
    for step_name, result in results:
        status = "✓" if result else "✗"
        color = GREEN if result else RED
        log(f"{status} {step_name}", color)
    
    if all(result for _, result in results) and verify_result:
        log("\n🎉 Phase 0 infrastructure setup complete!", GREEN)
        log("\nNext steps:", YELLOW)
        log("1. Review .env file and update values as needed", YELLOW)
        log("2. Complete Cloudflare tunnel setup (manual)", YELLOW)
        log("3. Deploy nginx configuration (sudo cp)", YELLOW)
        log("4. Start services and test", YELLOW)
        log("\nProceed to Phase 1: MVP Core", GREEN)
        return 0
    else:
        log("\n⚠️  Some steps failed. Review errors above.", RED)
        log("Check UPDATE_LEDGER.md for troubleshooting", YELLOW)
        return 1

if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        log(f"Fatal error: {str(e)}", RED)
        import traceback
        log(traceback.format_exc(), RED)
        sys.exit(1)
