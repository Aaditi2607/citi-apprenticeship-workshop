resource "aws_db_subnet_group" "this" {
  count      = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  name       = format("%s-rds-subnet-group-%s", var.aws_project, local.app_id)
  subnet_ids = length(local.private_subnet_ids) > 0 ? local.private_subnet_ids : local.public_subnet_ids

  tags = local.app_tags
}

resource "aws_security_group" "rds" {
  count       = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  name        = format("%s-rds-sg-%s", var.aws_project, local.app_id)
  description = "Security group for PostgreSQL RDS access from Lambda"
  vpc_id      = data.aws_vpc.this.id

  egress {
    description = "Allow outbound responses"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = local.app_tags
}

resource "aws_security_group_rule" "lambda_to_rds" {
  count                    = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  type                     = "egress"
  description              = "Allow Lambda to connect to PostgreSQL RDS"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.lambda[0].id
  source_security_group_id = aws_security_group.rds[0].id
}

resource "aws_security_group_rule" "rds_from_lambda" {
  count                    = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  type                     = "ingress"
  description              = "Allow PostgreSQL from Lambda"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  security_group_id        = aws_security_group.rds[0].id
  source_security_group_id = aws_security_group.lambda[0].id
}

resource "aws_rds_cluster" "this" {
  count                           = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  cluster_identifier              = format("%s-rds-%s", var.aws_project, local.app_id)
  engine                          = "aurora-postgresql"
  engine_mode                     = "provisioned"
  engine_version                  = "17.7"
  master_username                 = "superadmin"
  master_password                 = random_pet.this.id
  database_name                   = replace(var.aws_project, "-", "")
  backup_retention_period         = 7
  preferred_backup_window         = "07:00-09:00"
  skip_final_snapshot             = true
  storage_encrypted               = true
  db_subnet_group_name            = element(aws_db_subnet_group.this.*.name, count.index)
  vpc_security_group_ids          = [aws_security_group.rds[count.index].id]
  enabled_cloudwatch_logs_exports = ["postgresql"]

  serverlessv2_scaling_configuration {
    max_capacity = 4.0
    min_capacity = 0.0
  }

  tags = local.app_tags
}

resource "aws_rds_cluster_instance" "this" {
  count                      = data.aws_caller_identity.this.id != "000000000000" && var.aws_postgres_enabled ? 1 : 0
  cluster_identifier         = element(aws_rds_cluster.this.*.id, count.index)
  engine                     = element(aws_rds_cluster.this.*.engine, count.index)
  engine_version             = element(aws_rds_cluster.this.*.engine_version, count.index)
  identifier                 = format("%s-rds-%s", var.aws_project, local.app_id)
  instance_class             = "db.serverless"
  auto_minor_version_upgrade = true

  tags = local.app_tags
}
