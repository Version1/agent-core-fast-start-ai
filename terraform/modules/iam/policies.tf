
resource "aws_iam_role_policy" "request_permissions" {
  name = "${var.prefix}-request-policy"
  role = aws_iam_role.lambda_request.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = local.request_permissions
  })
}

resource "aws_iam_role_policy" "ai_permissions" {
  name = "${var.prefix}-ai-policy"
  role = aws_iam_role.lambda_ai.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = local.ai_permissions
  })
}

resource "aws_iam_role_policy" "admin_permissions" {
  name = "${var.prefix}-admin-policy"
  role = aws_iam_role.lambda_admin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = local.admin_permissions
  })
}

resource "aws_iam_role_policy" "step_functions_permissions" {
  name = "${var.prefix}-sfn-policy"
  role = aws_iam_role.step_functions.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = local.step_functions_permissions
  })
}

resource "aws_iam_role_policy" "eventbridge_permissions" {
  name = "${var.prefix}-eventbridge-policy"
  role = aws_iam_role.eventbridge.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = local.eventbridge_permissions
  })
}
