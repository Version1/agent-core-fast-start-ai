################################################################################
# SES Module — domain identities + 
################################################################################

variable "prefix" {}
variable "domain_name" {}

resource "aws_ses_domain_identity" "this" {
    domain = var.domain_name
}

# ─── Outputs ──────────────────────────────────────────────────────────────────

output "domain_identity_arn" { value = aws_ses_domain_identity.this.arn }
