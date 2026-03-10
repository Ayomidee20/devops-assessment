# DevOps Assessment: Node.js API on AWS ECS (Terraform)

This repository is a learning-focused, production-style DevOps project that demonstrates a modern workflow for building and deploying a simple Node.js API to AWS using **Docker**, **GitHub Actions**, **Amazon ECR**, **Terraform**, and **ECS Fargate**, fronted by an **Application Load Balancer** with **HTTPS (ACM)**.

## Project overview

- **API**: Node.js (Express) service on port `3000`
- **Datastore**: Redis
  - Local dev: Redis container via Docker Compose
  - AWS: Redis runs as a *sidecar container* in the same ECS task (keeps the service list limited; easy to learn)
- **CI/CD**: GitHub Actions runs tests, builds Docker images, and pushes to ECR
- **IaC**: Terraform provisions VPC (public/private subnets), ALB, ACM+Route53, ECR, ECS Fargate service, and CloudWatch logs

## Architecture

ASCII diagram (runtime traffic path):

```
Internet
  |
  v
Application Load Balancer (HTTP -> HTTPS)
  |
  v
ECS Fargate Service (private subnets)
  |
  v
Task: [Node.js API container] <-> [Redis sidecar container]
  |
  v
CloudWatch Logs
```

Key points:
- **Public**: ALB in public subnets; inbound `80/443`
- **Private**: ECS tasks in private subnets (no public IPs)
- **Security groups**:
  - ALB allows `80/443` from the internet
  - ECS tasks allow only `3000` **from the ALB security group**
- **HTTPS**: ACM certificate validated via Route53, attached to ALB listener on `443`

## API endpoints

- `GET /health`

```json
{ "status": "ok" }
```

- `GET /status`

```json
{
  "service": "devops-assessment-api",
  "uptime": 123.456,
  "timestamp": "2026-03-10T12:00:00.000Z"
}
```

- `POST /process`

Request:

```json
{ "data": "example" }
```

Response:

```json
{ "id": "…", "status": "processed" }
```

## Run locally (Docker Compose)

From the repo root:

```bash
docker compose -f docker/docker-compose.yml up --build
```

Verify:

```bash
curl -s http://localhost:3000/health
```

## Run tests

From `app/`:

```bash
npm install --package-lock-only
npm ci
npm test
```

Note: The repository intentionally does not commit a `package-lock.json` (to keep generation deterministic in CI). CI generates the lockfile then uses `npm ci`.

## CI/CD pipeline (GitHub Actions)

Workflow: `[.github/workflows/ci.yml](.github/workflows/ci.yml)`

On pull requests to `main`:
- Installs dependencies (lockfile generated, then `npm ci`)
- Runs Jest tests
- Builds the Docker image

On pushes to `main`:
- Does all of the above
- Authenticates to AWS using **OIDC**
- Pushes the Docker image to ECR tagged as:
  - `latest`
  - the commit SHA

### Required GitHub Secrets

- `AWS_ROLE_ARN`: IAM role for GitHub OIDC to assume (must trust your GitHub org/repo)
- `ECR_REPOSITORY`: ECR repository name (Terraform creates `${project_name}-api` by default, e.g. `devops-assessment-api`)

## Deploy infrastructure (Terraform)

Prereqs:
- AWS account credentials available locally (for Terraform)
- A public Route53 hosted zone for your domain

Steps:

```bash
cd terraform
terraform init
terraform plan \
  -var "hosted_zone_name=example.com" \
  -var "api_fqdn=api.example.com"
terraform apply \
  -var "hosted_zone_name=example.com" \
  -var "api_fqdn=api.example.com"
```

After apply, Terraform outputs:
- the ECR repository URL
- the ALB DNS name
- the API URL (`https://api.example.com`)

### Deploy a new app version

1. Push to `main` to publish an ECR image (tags: `latest` and SHA)
2. Update the deployed task to use the desired image tag:
   - Option A: keep `image_tag=latest` (default) and redeploy by forcing a new deployment in ECS
   - Option B: set `-var "image_tag=<sha>"` and re-apply Terraform

## Security considerations

- **No secrets committed**: configuration is via environment variables and GitHub Secrets
- **Non-root container**: Docker runtime uses the `node` user
- **Least privilege**: ECS execution role uses AWS managed execution policy; task role has no broad permissions by default
- **Network isolation**: ECS tasks run in private subnets with ingress only from the ALB
- **TLS**: HTTPS enforced via ALB listener and ACM certificate

## Design decisions

- **Redis sidecar on ECS**: keeps the AWS service footprint small and easy to understand. In production, you’d typically replace this with **ElastiCache for Redis** for durability and scaling.
- **NAT gateway**: required for private-subnet tasks to reach ECR and CloudWatch Logs.

