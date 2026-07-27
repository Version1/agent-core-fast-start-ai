variable "name" {
  type = string
}

variable "amplify_app_arn" {
  description = "ARN of the Amplify app to protect."
  type        = string
}

variable "tags" {
  type    = map(string)
  default = {}
}