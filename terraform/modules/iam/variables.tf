variable "prefix" {}
variable "account_id" {}
variable "region" {}
variable "s3_bucket_arn" {}
variable "dynamodb_table_arn" {}
variable "audit_trail_table_arn" {}
variable "sqs_queue_arns" { type = list(string) }
variable "eventbridge_bus_arn" {}
variable "step_functions_arn" { default = "" }
variable "aurora_cluster_arn" { default = "" }
variable "aurora_secret_arn" { default = "" }
variable "notifications_table_arn" { default = "" }
variable "cognito_user_pool_arn" { default = "" }
variable "ses_domain_identity_arn" { default = "" }
variable "ses_from_address" { default = "noreply@casehubportal.com" }
