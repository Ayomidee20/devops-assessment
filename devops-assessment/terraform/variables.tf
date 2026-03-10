variable "aws_region" {
  type        = string
  description = "AWS region to deploy into."
  default     = "eu-west-1"
}

variable "project_name" {
  type        = string
  description = "Prefix for resource names."
  default     = "devops-assessment"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the VPC."
  default     = "10.0.0.0/16"
}

variable "az_count" {
  type        = number
  description = "Number of availability zones to use."
  default     = 2
}

variable "hosted_zone_name" {
  type        = string
  description = "Route53 hosted zone name (e.g., example.com)."
  default     = "example.com"
}

variable "api_fqdn" {
  type        = string
  description = "FQDN for the API (e.g., api.example.com)."
  default     = "api.example.com"
}

variable "container_port" {
  type        = number
  description = "Container port for the Node.js API."
  default     = 3000
}

variable "desired_count" {
  type        = number
  description = "Desired number of ECS tasks."
  default     = 2
}

variable "task_cpu" {
  type        = number
  description = "Fargate task CPU units."
  default     = 512
}

variable "task_memory" {
  type        = number
  description = "Fargate task memory (MiB)."
  default     = 1024
}

variable "image_tag" {
  type        = string
  description = "Image tag to deploy from ECR."
  default     = "latest"
}

