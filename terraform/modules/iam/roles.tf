################################################################################
# modules/iam/roles.tf

################################################################################

# ─── Lambda Request/CRUD Role ────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_request" {
  name                 = "${var.prefix}-lambda-request-role"
  permissions_boundary = "arn:aws:iam::783050088916:policy/UKDDCAWSRestrictedAdmin-PermBoundary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ─── Lambda AI Agent Role ────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_ai" {
  name                 = "${var.prefix}-lambda-ai-role"
  permissions_boundary = "arn:aws:iam::783050088916:policy/UKDDCAWSRestrictedAdmin-PermBoundary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ─── Lambda Admin/Cognito Role ────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_admin" {
  name                 = "${var.prefix}-lambda-admin-role"
  permissions_boundary = "arn:aws:iam::783050088916:policy/UKDDCAWSRestrictedAdmin-PermBoundary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ─── Step Functions Role ──────────────────────────────────────────────────────

resource "aws_iam_role" "step_functions" {
  name                 = "${var.prefix}-sfn-role"
  permissions_boundary = "arn:aws:iam::783050088916:policy/UKDDCAWSRestrictedAdmin-PermBoundary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "states.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

# ─── EventBridge Role ─────────────────────────────────────────────────────────

resource "aws_iam_role" "eventbridge" {
  name                 = "${var.prefix}-eventbridge-role"
  permissions_boundary = "arn:aws:iam::783050088916:policy/UKDDCAWSRestrictedAdmin-PermBoundary"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "events.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}
