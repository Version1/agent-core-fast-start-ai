
################################################################################
# modules/iam/locals.tf  (CREATED NEw)
#
# CHANGES:
#   + Lambda Execution Permissions, Step Functions Permissions and Event Brigdge Permissions       — PutItem/Query on new audit trail table
#   + Role Compositions: Permissions grouped as request_permissions, ai_permissions and admin_permissions to easily define policies, particularly for lambda execution roles
#   + Role Compositions: eventbridge_permissions and step_functions_permissions have also been grouped for consistency
#   + Step Functions role gets audit trail read access for observability
################################################################################

locals {

# Lambda Execution Permissions
    cloudwatch_logs = {
        Sid      = "CloudWatchLogs"
        Effect   = "Allow"
        Action   = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.region}:${var.account_id}:log-group:/aws/lambda/${var.prefix}-*"
    }

    s3_documents = {
        Sid      = "S3DocumentsAccess"
        Effect   = "Allow"
        Action   = ["s3:PutObject", "s3:GetObject", "s3:ListBucket", "s3:HeadObject",
        "s3:GetObjectVersion", "s3:GetBucketLocation"]
        Resource = [var.s3_bucket_arn, "${var.s3_bucket_arn}/*"]
    }

    dynamodb_runtime = {
        Sid      = "DynamoDBRuntimeState"
        Effect   = "Allow"
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem",
        "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:Scan"]
        Resource = [var.dynamodb_table_arn,
        "${var.dynamodb_table_arn}/index/*"]
    }

    dynamodb_audit_trail = {
        Sid      = "DynamoDBAuditTrail"
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:Query", "dynamodb:GetItem"]
        Resource = [var.audit_trail_table_arn,
        "${var.audit_trail_table_arn}/index/*"]
    }

    ses = {
        Sid       = "SESSendEmail"
        Effect    = "Allow"
        Action    = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource  = [var.ses_domain_identity_arn]
        Condition = {
          StringEquals = { 
            "ses:FromAddress" = var.ses_from_address
          }
        }
    }

    aurora = {
        Sid      = "AuroraRDSDataAPI"
        Effect   = "Allow"
        Action   = [
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "rds-data:BeginTransaction",
          "rds-data:CommitTransaction",
          "rds-data:RollbackTransaction"
        ]
        Resource = var.aurora_cluster_arn != "" ? [var.aurora_cluster_arn] : [
          "arn:aws:rds:${var.region}:${var.account_id}:cluster:${var.prefix}-postgres"
        ]
    }

    secrets_manager = {
        Sid      = "SecretsManagerAurora"
        Effect   = "Allow"
        Action   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
        Resource = [
          "arn:aws:secretsmanager:${var.region}:${var.account_id}:secret:${var.prefix}/*",
          "arn:aws:secretsmanager:${var.region}:${var.account_id}:secret:rds!cluster-*"
        ]
    }

    sqs = {
        Sid      = "SQSAccess"
        Effect   = "Allow"
        Action   = ["sqs:SendMessage", "sqs:ReceiveMessage",
        "sqs:DeleteMessage", "sqs:GetQueueAttributes"]
        Resource = var.sqs_queue_arns
    }

    eventbridge = {
        Sid      = "EventBridgePut"
        Effect   = "Allow"
        Action   = ["events:PutEvents"]
        Resource = var.eventbridge_bus_arn
    }

    textract = {
        Sid      = "TextractOCR"
        Effect   = "Allow"
        Action   = ["textract:DetectDocumentText", "textract:AnalyzeDocument"]
        Resource = "*"
    }

    bedrock = {
        Sid      = "BedrockInvokeModel"
        Effect   = "Allow"
        Action   = ["bedrock:InvokeModel", "bedrock:InvokeModelWithResponseStream"]
        Resource = [
          "arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-sonnet-4-6",
          "arn:aws:bedrock:eu-west-2::foundation-model/anthropic.claude-3-7-sonnet-20250219-v1:0"
        ]
    }

    marketplace = {
        Sid      = "MarketplaceAnthropicSubscription"
        Effect   = "Allow"
        Action   = ["aws-marketplace:ViewSubscriptions"]
        Resource = "*"
    }

    xray = {
        Sid      = "XRayTracing"
        Effect   = "Allow"
        Action   = ["xray:PutTraceSegments", "xray:PutTelemetryRecords"]
        Resource = "*"
    }

    dynamodb_notifications = (
      # Conditional: Notifications DynamoDB (only when ARN provided)
        var.notifications_table_arn != "" ? [{
            Sid    = "DynamoDBNotifications"
            Effect = "Allow"
            Action = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:Query", "dynamodb:DeleteItem"]
            Resource = [var.notifications_table_arn, "${var.notifications_table_arn}/index/*"]
        }] : []
    )

    cognito = (
        var.cognito_user_pool_arn != "" ? [{
            Sid    = "CognitoAdmin"
            Effect = "Allow"
            Action = [
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminDeleteUser",
            "cognito-idp:AdminGetUser",
            "cognito-idp:AdminEnableUser",
            "cognito-idp:AdminDisableUser",
            "cognito-idp:AdminUpdateUserAttributes",
            "cognito-idp:AdminAddUserToGroup",
            "cognito-idp:AdminRemoveUserFromGroup",
            "cognito-idp:AdminListGroupsForUser",
            "cognito-idp:ListUsers"
            ]
            Resource = [var.cognito_user_pool_arn]
        }] : []
    )

# Step Functions Permissions

    invoke_lambda_sf = {
        Sid      = "InvokeLambda"
        Effect   = "Allow"
        Action   = ["lambda:InvokeFunction"]
        Resource = "arn:aws:lambda:${var.region}:${var.account_id}:function:${var.prefix}-*"
    }

    sqs_send_sf = {
        Sid      = "SQSSend"
        Effect   = "Allow"
        Action   = ["sqs:SendMessage"]
        Resource = var.sqs_queue_arns
    }

    poll_dynamodb_sf = {
        Sid    = "DynamoDBPollCaseStatus"
        Effect = "Allow"
        Action = ["dynamodb:GetItem"]
        Resource = [var.dynamodb_table_arn,
        "${var.dynamodb_table_arn}/index/*"]
    }

    xray_sf = {
        Sid    = "XRayTracing"
        Effect = "Allow"
        Action = ["xray:PutTraceSegments", "xray:PutTelemetryRecords",
        "xray:GetSamplingRules", "xray:GetSamplingTargets"]
        Resource = "*"
    }

    cloudwatch_logs_sf = {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = ["logs:CreateLogDelivery", "logs:GetLogDelivery",
          "logs:UpdateLogDelivery", "logs:DeleteLogDelivery",
          "logs:ListLogDeliveries", "logs:PutResourcePolicy",
        "logs:DescribeResourcePolicies", "logs:DescribeLogGroups"]
        Resource = "*"
    }

# EventBrige Permissions

    start_sf = {
      Sid      = "StartStepFunctions"
      Effect   = "Allow"
      Action   = ["states:StartExecution"]
      Resource = var.step_functions_arn != "" ? var.step_functions_arn : "*"
    }

# Role Compositions

    request_permissions = concat([
        local.cloudwatch_logs,
        local.xray,
        local.s3_documents,
        local.dynamodb_runtime,
        local.ses,
        local.aurora,
        local.secrets_manager,
        local.sqs,
        local.eventbridge
    ],
        local.dynamodb_notifications
    )

    ai_permissions = [
        local.bedrock,
        local.textract,
        local.marketplace,
        local.dynamodb_runtime,
        local.s3_documents,
        local.aurora,
        local.sqs
    ]

    admin_permissions = concat ([
        local.cloudwatch_logs,
        local.xray,
        local.aurora
    ],
        local.cognito
    )

    step_functions_permissions = [
        local.invoke_lambda_sf,
        local.sqs_send_sf,
        local.poll_dynamodb_sf,
        local.xray_sf,
        local.cloudwatch_logs_sf
    ]

    eventbridge_permissions = [
        local.start_sf
    ]
}
