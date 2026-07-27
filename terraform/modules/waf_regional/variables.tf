variable "name" {
  description = "Name for the WAF web ACL and associated CloudWatch metrics."
  type        = string
}

variable "resource_arn" {
  description = "ARN of the regional resource to protect (ALB, API Gateway stage, AppSync API, etc.)."
  type        = string
}
