# ─── Outputs ──────────────────────────────────────────────────────────────────

output "step_functions_role_arn" { value = aws_iam_role.step_functions.arn }
output "eventbridge_role_arn" { value = aws_iam_role.eventbridge.arn }
output "lambda_request_role_arn" { value = aws_iam_role.lambda_request.arn }
output "lambda_ai_role_arn" { value = aws_iam_role.lambda_ai.arn }
output "lambda_admin_role_arn" { value = aws_iam_role.lambda_admin.arn }

