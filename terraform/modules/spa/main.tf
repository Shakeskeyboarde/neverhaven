terraform {
  required_providers {
    aws = { source = "hashicorp/aws" }
  }
}

variable "zone_name" {
  type = string
  description = "Route53 zone name where the subdomains will be created"
}

variable "subdomains" {
  type = list(string)
  description = "subdomains of the zone to add as cloudfront aliases"
  validation {
    condition     = length(var.subdomains) > 0
    error_message = "At least one subdomain must be provided."
  }
}

variable "api_url" {
  type    = string
  description = "URL of the API that the frontend is allowed to call (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/connect-src)"
  default = null
}

variable "acm_certificate_arn" {
  type = string
  description = "ARN of an ACM certificate to use for the CloudFront distribution"
}

variable "bucket_name" {
  type    = string
  description = "S3 bucket containing the SPA assets (defaults to the zone name)"
  default = null
}

data "aws_route53_zone" "this" {
  name = var.zone_name
}

locals {
  fqdns       = [for subdomain in var.subdomains : join(".", compact([subdomain, var.zone_name]))]
  bucket_name = coalesce(var.bucket_name, var.zone_name)
  prefix      = replace(local.bucket_name, "/[^\\w-]+/", "-")
  min_ttl     = 0
  default_ttl = 0
  max_ttl     = 7 * 24 * 60 * 60 // 7 days in seconds
}

locals {
}

module "s3" {
  source        = "terraform-aws-modules/s3-bucket/aws"
  bucket        = local.bucket_name
  force_destroy = true
  lifecycle_rule = [{
    id      = "secondary"
    enabled = true
    filter = {
      prefix = "secondary/"
    }
    expiration = {
      days = floor(local.max_ttl / 24 / 60 / 60) * 2
    }
  }]
}

resource "aws_cloudfront_cache_policy" "this" {
  for_each = {
    mutable   = local.default_ttl
    immutable = local.max_ttl
  }
  name        = "${local.prefix}--${each.key}"
  min_ttl     = local.min_ttl
  default_ttl = each.value
  max_ttl     = local.max_ttl
  parameters_in_cache_key_and_forwarded_to_origin {
    cookies_config {
      cookie_behavior = "none"
    }
    headers_config {
      header_behavior = "none"
    }
    query_strings_config {
      query_string_behavior = "none"
    }
  }
}

resource "aws_cloudfront_response_headers_policy" "this" {
  for_each = {
    mutable   = "max-age=${local.default_ttl}, stale-while-revalidate=86400"
    immutable = "max-age=${local.max_ttl}, immutable"
  }
  name = "${local.prefix}--${each.key}"
  custom_headers_config {
    items {
      override = false
      header   = "cache-control"
      value    = each.value
    }
  }
  cors_config {
    origin_override                  = false
    access_control_allow_credentials = false
    access_control_allow_origins {
      items = ["*"]
    }
    access_control_allow_methods {
      items = ["GET", "HEAD", "OPTIONS"]
    }
    access_control_allow_headers {
      items = ["*"]
    }
  }
  security_headers_config {
    content_type_options {
      override = true
    }
    frame_options {
      override     = false
      frame_option = "SAMEORIGIN"
    }
    referrer_policy {
      override        = false
      referrer_policy = "strict-origin-when-cross-origin"
    }
    xss_protection {
      override   = false
      mode_block = true
      protection = true
    }
    strict_transport_security {
      override                   = false
      access_control_max_age_sec = 31536000 /* 1 year */
      include_subdomains         = true
      preload                    = true
    }
    content_security_policy {
      content_security_policy = join("; ", [
        "default-src 'self'",
        "connect-src ${join(" ", compact(["'self'", var.api_url]))}",
        "style-src 'self' 'unsafe-inline'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'none'"
      ])
      override = true
    }
  }
}

module "cloudfront" {
  source              = "terraform-aws-modules/cloudfront/aws"
  aliases             = local.fqdns
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  http_version        = "http2and3"
  is_ipv6_enabled     = true
  viewer_certificate = {
    acm_certificate_arn      = var.acm_certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2019"
  }
  create_origin_access_control = true
  origin_access_control = {
    "${local.prefix}--s3oac" = {
      description      = "CloudFront access to S3"
      origin_type      = "s3"
      signing_behavior = "always"
      signing_protocol = "sigv4"
    }
  }
  origin = {
    spa_primary = {
      domain_name           = module.s3.s3_bucket_bucket_regional_domain_name
      origin_path           = "/primary"
      origin_access_control = "${local.prefix}--s3oac"
    }
    spa_secondary = {
      domain_name           = module.s3.s3_bucket_bucket_regional_domain_name
      origin_path           = "/secondary"
      origin_access_control = "${local.prefix}--s3oac"
    }
  }
  origin_group = {
    spa_failover = {
      failover_status_codes      = [403, 404]
      primary_member_origin_id   = "spa_primary"
      secondary_member_origin_id = "spa_secondary"
    }
  }
  default_cache_behavior = {
    target_origin_id           = "spa_failover"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    use_forwarded_values       = false
    cache_policy_id            = aws_cloudfront_cache_policy.this["mutable"].id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.this["mutable"].id
  }
  ordered_cache_behavior = [
    {
      path_pattern               = "/assets/*"
      target_origin_id           = "spa_failover"
      viewer_protocol_policy     = "redirect-to-https"
      compress                   = true
      use_forwarded_values       = false
      cache_policy_id            = aws_cloudfront_cache_policy.this["immutable"].id
      response_headers_policy_id = aws_cloudfront_response_headers_policy.this["immutable"].id
    }
  ]
  custom_error_response = [
    {
      error_code         = 403
      response_code      = 200
      response_page_path = "/index.html"
    },
    {
      error_code         = 404
      response_code      = 200
      response_page_path = "/index.html"
    },
  ]
}


data "aws_iam_policy_document" "this" {
  statement {
    actions   = ["s3:GetObject"]
    resources = ["${module.s3.s3_bucket_arn}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [module.cloudfront.cloudfront_distribution_arn]
    }
  }
}

resource "aws_s3_bucket_policy" "this" {
  bucket = local.bucket_name
  policy = data.aws_iam_policy_document.this.json
}

module "route53-records" {
  source  = "terraform-aws-modules/route53/aws//modules/records"
  zone_id = data.aws_route53_zone.this.zone_id
  records = [for subdomain in var.subdomains :
    {
      name = subdomain
      type = "A"
      alias = {
        name    = module.cloudfront.cloudfront_distribution_domain_name
        zone_id = module.cloudfront.cloudfront_distribution_hosted_zone_id
      }
  }]
}

output "cloudfront_distribution_id" {
  value = module.cloudfront.cloudfront_distribution_id
}
