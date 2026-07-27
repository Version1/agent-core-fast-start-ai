//locals {
//common_tags = {
//Service     = var.project_name
//Environment = var.environment
//Provisioner = "Terraform"
//}
//r`1`esource_prefix = "${var.project_name}-${var.environment}"

#sftp_keys = jsondecode(var.sftp_keys_json)
//}