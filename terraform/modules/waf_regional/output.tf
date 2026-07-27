output "web_acl_arn" {
  description = "ARN of the regional WAF web ACL."
  value       = aws_wafv2_web_acl.this.arn
}

output "web_acl_id" {
  description = "ID of the regional WAF web ACL."
  value       = aws_wafv2_web_acl.this.id
}
