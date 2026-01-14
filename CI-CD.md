# CI/CD Pipeline Documentation

## Overview

This project includes CI/CD pipelines for both GitHub Actions and GitLab CI.

## GitHub Actions

### Pipeline Stages

1. **Lint & Type Check** - Code quality checks
2. **Unit Tests** - Run test suite with coverage
3. **Build** - Compile TypeScript to JavaScript
4. **Security Scan** - Vulnerability scanning with Trivy
5. **Docker Build** - Build and push container image
6. **Deploy** - Deploy to staging/production

### Setup

1. **GitHub Secrets Required:**

```
GITHUB_TOKEN (automatically provided)
DATABASE_URL (production database)
```

2. **Enable GitHub Packages:**

- Go to Settings → Actions → General
- Enable "Read and write permissions" for GITHUB_TOKEN

3. **Configure Environments:**

- Go to Settings → Environments
- Create "staging" and "production" environments
- Add protection rules and secrets

### Deployment

**Automatic:**

- Push to `develop` → Deploys to staging
- Push to `main` → Deploys to production

**Manual:**

- Go to Actions tab
- Select workflow run
- Click "Review deployments"

## GitLab CI

### Pipeline Stages

1. **lint** - Code quality
2. **test** - Unit tests
3. **build** - Application build
4. **security** - Security scans
5. **deploy** - Environment deployment

### Setup

1. **GitLab CI/CD Variables:**

```
CI_REGISTRY_USER (GitLab username)
CI_REGISTRY_PASSWORD (GitLab token)
DATABASE_URL (production database)
```

2. **Configure Runners:**

- Go to Settings → CI/CD → Runners
- Enable shared runners or add project runners

3. **Configure Environments:**

- Go to Deployments → Environments
- Add staging and production URLs

### Deployment

Deployments are **manual** by default. To deploy:

1. Go to CI/CD → Pipelines
2. Find your pipeline
3. Click play button on deploy job

## Docker Deployment

### Build Image Locally

```bash
docker build -t ekoru-marketplace:latest .
```

### Run Container

```bash
docker run -p 4002:4002 \
  -e DATABASE_URL="your-database-url" \
  -e NODE_ENV=production \
  ekoru-marketplace:latest
```

## Kubernetes Deployment

### Deploy to K8s

```bash
kubectl apply -f k8s/
```

### Update Deployment

```bash
kubectl set image deployment/marketplace \
  marketplace=ghcr.io/your-org/ekoru-marketplace:latest
```

## Environment Variables

Required for CI/CD:

```env
# Application
PORT=4002
NODE_ENV=production

# Database
DATABASE_URL=postgresql://...

# Monitoring (optional)
GRAFANA_ADMIN_USER=admin
GRAFANA_ADMIN_PASSWORD=secure-password
```

## Monitoring Integration

After deployment, verify:

1. Application health: `curl http://your-app/health`
2. Metrics endpoint: `curl http://your-app/metrics`
3. Grafana dashboard shows data

## Rollback Strategy

### GitHub Actions

```bash
# Revert to previous commit
git revert HEAD
git push
```

### GitLab CI

1. Go to Deployments → Environments
2. Click "Rollback" on previous deployment

### Kubernetes

```bash
kubectl rollout undo deployment/marketplace
```

## Troubleshooting

### Build Fails

- Check Node.js version matches (22.14.0)
- Verify all dependencies are in package.json
- Check Prisma schema is valid

### Tests Fail

- Ensure test database is accessible
- Check environment variables
- Review test logs

### Deployment Fails

- Verify DATABASE_URL is correct
- Check application logs
- Ensure migrations ran successfully

## Best Practices

1. **Always run migrations** before deploying new code
2. **Test in staging** before production
3. **Monitor metrics** after deployment
4. **Keep secrets secure** - never commit them
5. **Use semantic versioning** for releases

## Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [GitLab CI Docs](https://docs.gitlab.com/ee/ci/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
