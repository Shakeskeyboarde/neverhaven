terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

variable "zone_name" {
  type = string
  description = "Route53 zone name where validation records will be created"
}

variable "subdomains" {
  type = list(string)
  description = "subdomains of the zone to add as ACM certificate subject alternative names"
  validation {
    condition     = length(var.subdomains) > 0
    error_message = "At least one subdomain must be provided."
  }
}

data "aws_route53_zone" "this" {
  name = var.zone_name
}

locals {
  fqdns = [for subdomain in var.subdomains : join(".", compact([subdomain, var.zone_name]))]
}

module "acm" {
  source                    = "terraform-aws-modules/acm/aws"
  zone_id                   = data.aws_route53_zone.this.zone_id
  domain_name               = local.fqdns[0]
  subject_alternative_names = slice(local.fqdns, 1, length(local.fqdns))
  validation_method         = "DNS"
}

output "certificate_arn" {
  value = try(module.acm.acm_certificate_arn, null)
}
