terraform {
  required_version = ">=1.8.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    shared_credentials_files = ["../aws.ini"]
    region                   = "us-east-1"
    bucket                   = "tfstate.incomplete.quest"
    dynamodb_table           = "tfstate.incomplete.quest"
    key                      = "neverhaven"
    encrypt                  = true
  }
}

provider "aws" {
  shared_credentials_files = ["../aws.ini"]
}

data "aws_route53_zone" "this" {
  name = "neverhaven.incomplete.quest"
}

module "acm" {
  source     = "./modules/acm"
  zone_name  = data.aws_route53_zone.this.name
  subdomains = ["", "www", "api"]
}

module "spa" {
  source              = "./modules/spa"
  zone_name           = data.aws_route53_zone.this.name
  subdomains          = ["", "www"]
  acm_certificate_arn = module.acm.certificate_arn
}

output "cloudfront_distribution_id" {
  value = module.spa.cloudfront_distribution_id
}
