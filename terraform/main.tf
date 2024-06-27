terraform {
  required_version = ">=1.8.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    shared_credentials_files = ["aws.ini"]
    region                   = "us-east-1"
    bucket                   = "tfstate.incomplete.quest"
    dynamodb_table           = "tfstate.incomplete.quest"
    key                      = "neverhaven"
    encrypt                  = true
  }
}

provider "aws" {
  shared_credentials_files = ["aws.ini"]
}
