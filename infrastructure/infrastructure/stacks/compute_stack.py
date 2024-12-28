from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_apigateway as apigateway,
    CfnOutput
)
from constructs import Construct

class ComputeStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, 
                 storage_table_arn: str, cognito_pool_arn: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create VPC with a single public subnet to save costs
        self.vpc = ec2.Vpc(
            self, "SecureToDoVPC",
            max_azs=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            nat_gateways=0,  # No NAT Gateway needed for single public subnet
        )

        # Create EC2 Role
        instance_role = iam.Role(
            self, "BackendInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")  # For SSH access through Systems Manager
            ]
        )

        # Add DynamoDB permissions
        instance_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[storage_table_arn, f"{storage_table_arn}/index/*"]
            )
        )

        # Add Cognito permissions
        instance_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cognito-idp:AdminInitiateAuth",
                    "cognito-idp:AdminCreateUser",
                    "cognito-idp:AdminSetUserPassword",
                    "cognito-idp:AdminUpdateUserAttributes",
                    "cognito-idp:AdminDeleteUser",
                    "cognito-idp:AdminGetUser",
                    "cognito-idp:AdminConfirmSignUp",
                    "cognito-idp:AdminUserGlobalSignOut",
                    "cognito-idp:AdminListGroupsForUser",
                    "cognito-idp:AdminGetDevice",
                    "cognito-idp:AdminListDevices",
                    "cognito-idp:AdminRespondToAuthChallenge"
                ],
                resources=[cognito_pool_arn]
            )
        )

        # Add CloudWatch Logs permissions
        instance_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

        # Security group for EC2 instance
        security_group = ec2.SecurityGroup(
            self, "BackendSecurityGroup",
            vpc=self.vpc,
            allow_all_outbound=True,
            description="Security group for backend EC2 instance"
        )

        # Allow inbound HTTP from API Gateway's VPC Links only
        security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5000),
            description="Allow inbound HTTP from VPC"
        )

        # Create EC2 Instance
        self.instance = ec2.Instance(
            self, "BackendInstance",
            vpc=self.vpc,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),  # Free tier eligible
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            role=instance_role,
            security_group=security_group,
            user_data=ec2.UserData.custom('''#!/bin/bash
# Install Docker
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create app directory
mkdir -p /app
''')
        )

        # Create VPC Link for API Gateway
        vpc_link = apigateway.VpcLink(
            self, "BackendVpcLink",
            targets=[self.instance]
        )

        # Create API Gateway
        api = apigateway.RestApi(
            self, "SecureToDoApi",
            rest_api_name="SecureToDo API",
            description="API Gateway for SecureToDo backend",
            deploy_options=apigateway.StageOptions(stage_name="prod"),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # You should restrict this in production
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["*"]
            )
        )

        # Create integration
        integration = apigateway.Integration(
            type=apigateway.IntegrationType.HTTP_PROXY,
            integration_http_method="ANY",
            options=apigateway.IntegrationOptions(
                connection_type=apigateway.ConnectionType.VPC_LINK,
                vpc_link=vpc_link,
                request_parameters={
                    "integration.request.header.X-Forwarded-For": "method.request.header.X-Forwarded-For"
                }
            ),
            uri=f"http://{self.instance.instance_private_ip}:5000/{{proxy}}"
        )

        # Add proxy resource with ANY method
        api.root.add_proxy(
            default_integration=integration,
            any_method=True
        )

        # Output the API Gateway URL
        CfnOutput(
            self, "ApiUrl",
            value=api.url,
            description="URL of the API Gateway endpoint"
        ) 