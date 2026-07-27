terraform {
  backend "s3" {
    bucket         = "faststart-tf-state"
    key            = "casetriage/infra.tfstate"
    region         = "eu-west-2"
    encrypt        = true
    dynamodb_table = "faststart-statelock"
  }
}

## Make sure the bucket is created