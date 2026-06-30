#!/bin/bash

# KOTA PAL - Production Deployment Script
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}
DEPLOYMENT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
validate_environment() {
    log_info "Validating $ENVIRONMENT environment..."

    if [ ! -f ".env.$ENVIRONMENT" ]; then
        log_error ".env.$ENVIRONMENT file not found"
        exit 1
    fi

    # Source environment file
    source ".env.$ENVIRONMENT"

    # Check required variables
    required_vars=(
        "JWT_SECRET"
        "REDIS_URL"
        "DATABASE_URL"
        "NODE_ENV"
    )

    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            log_error "Missing required environment variable: $var"
            exit 1
        fi
    done

    log_success "Environment validation passed"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_commands=()

    # Check Node.js
    if ! command -v node &> /dev/null; then
        missing_commands+=("node")
    else
        log_success "Node.js $(node -v) found"
    fi

    # Check npm
    if ! command -v npm &> /dev/null; then
        missing_commands+=("npm")
    else
        log_success "npm $(npm -v) found"
    fi

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_commands+=("docker")
    else
        log_success "Docker $(docker --version) found"
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        missing_commands+=("docker-compose")
    else
        log_success "Docker Compose $(docker-compose --version) found"
    fi

    if [ ${#missing_commands[@]} -gt 0 ]; then
        log_error "Missing required commands: ${missing_commands[@]}"
        exit 1
    fi

    log_success "All prerequisites found"
}

# Run tests
run_tests() {
    log_info "Running tests..."

    if ! npm test; then
        log_error "Tests failed"
        exit 1
    fi

    log_success "Tests passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."

    npm ci --only=production

    log_success "Dependencies installed"
}

# Build Docker image
build_docker_image() {
    local image_name="kota-pal:$ENVIRONMENT"
    local registry="${DOCKER_REGISTRY:-docker.io}"

    log_info "Building Docker image: $image_name..."

    docker build \
        --build-arg ENVIRONMENT=$ENVIRONMENT \
        --tag $image_name \
        --tag "$registry/$image_name" \
        --file Dockerfile \
        .

    log_success "Docker image built: $image_name"
}

# Push Docker image
push_docker_image() {
    local image_name="$DOCKER_REGISTRY/kota-pal:$ENVIRONMENT"

    if [ -z "$DOCKER_REGISTRY" ]; then
        log_warning "DOCKER_REGISTRY not set, skipping push"
        return
    fi

    log_info "Pushing Docker image: $image_name..."

    docker login -u "$DOCKER_USERNAME" -p "$DOCKER_PASSWORD" "$DOCKER_REGISTRY"
    docker push "$image_name"

    log_success "Docker image pushed"
}

# Deploy with Docker Compose
deploy_docker_compose() {
    log_info "Deploying with Docker Compose..."

    docker-compose -f "docker-compose.$ENVIRONMENT.yml" pull
    docker-compose -f "docker-compose.$ENVIRONMENT.yml" up -d

    log_success "Deployment completed with Docker Compose"
}

# Deploy to Kubernetes
deploy_kubernetes() {
    local namespace="$ENVIRONMENT"

    log_info "Deploying to Kubernetes namespace: $namespace..."

    # Create namespace if not exists
    kubectl create namespace "$namespace" --dry-run=client -o yaml | kubectl apply -f -

    # Create secrets
    kubectl create secret generic kota-pal-secrets \
        --from-literal=jwt-secret="$JWT_SECRET" \
        --from-literal=redis-url="$REDIS_URL" \
        --from-literal=database-url="$DATABASE_URL" \
        -n "$namespace" \
        --dry-run=client -o yaml | kubectl apply -f -

    # Deploy
    kubectl apply -f "k8s/$ENVIRONMENT/deployment.yml" -n "$namespace"
    kubectl apply -f "k8s/$ENVIRONMENT/service.yml" -n "$namespace"

    # Wait for rollout
    kubectl rollout status deployment/kota-pal-backend -n "$namespace" --timeout=5m

    log_success "Kubernetes deployment completed"
}

# Health check
health_check() {
    log_info "Running health check..."

    local max_attempts=30
    local attempt=1
    local healthy=false

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost:3000/ > /dev/null 2>&1; then
            healthy=true
            break
        fi

        log_warning "Health check failed, attempt $attempt/$max_attempts"
        sleep 2
        ((attempt++))
    done

    if [ "$healthy" = true ]; then
        log_success "Health check passed"
    else
        log_error "Health check failed after $max_attempts attempts"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."

    npm run migrate:db

    log_success "Database migrations completed"
}

# Backup database
backup_database() {
    local backup_dir="./backups"
    local backup_file="$backup_dir/backup-$(date +%Y%m%d-%H%M%S).sql"

    log_info "Backing up database..."

    mkdir -p "$backup_dir"

    if [ -z "$DATABASE_URL" ]; then
        log_warning "DATABASE_URL not set, skipping backup"
        return
    fi

    # Extract connection string
    # postgresql://user:pass@host:port/db
    pg_dump "$DATABASE_URL" > "$backup_file"

    log_success "Database backed up to: $backup_file"
}

# Rollback deployment
rollback_deployment() {
    log_warning "Rolling back deployment..."

    case "$ENVIRONMENT" in
        staging|production)
            docker-compose -f "docker-compose.$ENVIRONMENT.yml" down
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    log_success "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting deployment for $ENVIRONMENT environment"

    # Validate
    validate_environment
    check_prerequisites

    # Build & Test
    install_dependencies
    run_tests

    # Backup (for production)
    if [ "$ENVIRONMENT" = "production" ]; then
        backup_database
    fi

    # Deploy
    case "$ENVIRONMENT" in
        staging)
            build_docker_image
            deploy_docker_compose
            ;;
        production)
            build_docker_image
            push_docker_image
            deploy_kubernetes
            ;;
        *)
            log_error "Unknown environment: $ENVIRONMENT"
            exit 1
            ;;
    esac

    # Migrations
    run_migrations

    # Health check
    health_check

    log_success "Deployment completed successfully!"
    log_info "Dashboard available at: https://kota-pal.example.com"
}

# Parse arguments
case "${1:-}" in
    rollback)
        rollback_deployment
        ;;
    *)
        main
        ;;
esac
