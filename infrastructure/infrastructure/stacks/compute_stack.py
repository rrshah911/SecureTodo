from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_apigatewayv2 as apigwv2,
    aws_apigatewayv2_integrations as apigw_integrations,
    CfnOutput,
    Duration,
)
from constructs import Construct

class ComputeStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 storage_table_arn: str, cognito_pool_arn: str,
                 **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with single public subnet (minimize NAT Gateway costs)
        vpc = ec2.Vpc(
            self, "SecureToDoVPC",
            max_azs=1,
            nat_gateways=0,  # No NAT Gateway to save costs
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Security group for EC2
        security_group = ec2.SecurityGroup(
            self, "SecureToDoSG",
            vpc=vpc,
            allow_all_outbound=True,
            description="Security group for SecureToDo EC2 instance"
        )

        # Allow inbound HTTP from API Gateway
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(5000),
            description="Allow HTTP inbound"
        )

        # Allow SSH for deployment (you can restrict this to your IP)
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(22),
            description="Allow SSH inbound"
        )

        # IAM role for EC2
        role = iam.Role(
            self, "SecureToDoEC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com")
        )

        # Add minimum required permissions
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )

        # Add DynamoDB permissions (specific to our table)
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query"
                ],
                resources=[storage_table_arn, f"{storage_table_arn}/index/*"]
            )
        )

        # Add Cognito permissions (specific to our user pool)
        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "cognito-idp:GetUser",
                    "cognito-idp:AdminGetUser"
                ],
                resources=[cognito_pool_arn]
            )
        )

        # Use Amazon Linux 2 (free tier eligible)
        ami = ec2.MachineImage.latest_amazon_linux2()

        # Create t2.micro instance (free tier eligible)
        instance = ec2.Instance(
            self, "SecureToDoInstance",
            instance_type=ec2.InstanceType("t2.micro"),
            machine_image=ami,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=security_group,
            role=role,
            user_data=ec2.UserData.custom('''#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
mkdir -p /home/ec2-user/app
chown -R ec2-user:ec2-user /home/ec2-user/app
''')
        )

        # Create HTTP API with CORS configuration
        http_api = apigwv2.HttpApi(
            self, "SecureToDoApi",
            cors_preflight={
                "allow_methods": [
                    apigwv2.CorsHttpMethod.GET,
                    apigwv2.CorsHttpMethod.POST,
                    apigwv2.CorsHttpMethod.PUT,
                    apigwv2.CorsHttpMethod.DELETE,
                    apigwv2.CorsHttpMethod.OPTIONS,
                ],
                "allow_origins": ["http://173.63.123.188:5173"],  # Allow local development
                "allow_headers": [
                    "Content-Type",
                    "Authorization",
                    "Origin",
                    "Accept",
                ],
                "max_age": Duration.days(1),
                "allow_credentials": True,
            }
        )

        # Create VPC Link integration
        integration = apigw_integrations.HttpUrlIntegration(
            id="EC2Integration",
            url=f"http://{instance.instance_private_ip}:5000/",  # Base URL
            method=apigwv2.HttpMethod.ANY,        )

        # Add routes with proper CORS handling
        http_api.add_routes(
            path="/{proxy+}",  # Matches any path, including /api/tasks
            methods=[apigwv2.HttpMethod.ANY],
            integration=integration,
        )

        # Outputs
        CfnOutput(
            self, "ApiUrl",
            value=http_api.url if http_api.url else "undefined",
            description="URL of the HTTP API endpoint"
        )

        CfnOutput(
            self, "InstancePublicIP",
            value=instance.instance_public_ip,
            description="Public IP of EC2 instance"
        ) 