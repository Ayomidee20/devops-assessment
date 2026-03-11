output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.this.id
}

output "alb_dns_name" {
  description = "ALB DNS name."
  value       = aws_lb.this.dns_name
}

output "alb_url" {
  description = "Base URL for ALB (HTTP)."
  value       = "http://${aws_lb.this.dns_name}"
}

output "health_url" {
  description = "Health check URL."
  value       = "http://${aws_lb.this.dns_name}/health"
}

output "ecr_repository_url" {
  description = "ECR repository URL for the API image."
  value       = aws_ecr_repository.api.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.this.name
}

output "ecs_service_name" {
  description = "ECS service name."
  value       = aws_ecs_service.api.name
}

