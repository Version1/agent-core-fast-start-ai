output "web_acl_arn" {
  description = "ARN of the CloudFront-scoped WAF web ACL."
  value       = aws_wafv2_web_acl.this.arn
}

output "web_acl_id" {
  description = "ID of the CloudFront-scoped WAF web ACL."
  value       = aws_wafv2_web_acl.this.id
}