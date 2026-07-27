################################################################################
# Variables — Case Triage Management System
################################################################################

variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "eu-west-2" # London — appropriate for UK public sector
}

variable "environment" {
  description = "Deployment environment (dev / staging / prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Short project identifier used in all resource names"
  type        = string
  default     = "case-triage"
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  sensitive   = true
  default     = ""
}

variable "amplify_app_domain" {
  description = <<-EOT
    Hostname of the deployed Amplify app only (no https://), e.g. main.d1a2b3c4d5e6f.amplifyapp.com.
    Required for Cognito OAuth: the app sends users to Hosted UI with redirect_uri https://<this-host>/api/auth/callback.
    If this is left empty, only localhost callbacks are allowed and production login shows
    "An error was encountered with the requested page." Copy the value from terraform output amplify_hostname_for_cognito.
  EOT
  type        = string
  default     = ""
}

variable "cognito_extra_callback_urls" {
  description = "Additional allowed OAuth callback URLs for the portal client (e.g. custom Amplify domain)."
  type        = list(string)
  default     = []
}

variable "cognito_extra_logout_urls" {
  description = "Additional allowed logout URLs for the portal client (must match redirect after sign-out)."
  type        = list(string)
  default     = []
}

variable "ses_sender_email" {
  description = "Verified SES sender email address"
  type        = string
  default     = "noreply@casehubportal.com"
}

variable "domain_name" {
  description = "Custom domain name for the Amplify app (e.g. www.example.com)"
  type        = string
  default     = "casehubportal.com"
}
