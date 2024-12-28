#!/usr/bin/env python3
import os
import aws_cdk as cdk
from infrastructure.stacks.storage_stack import StorageStack
from infrastructure.stacks.auth_stack import AuthStack
from infrastructure.stacks.compute_stack import ComputeStack

app = cdk.App()

# Environment configuration
env = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
)

# Create storage and auth stacks
storage = StorageStack(app, "SecureToDoStorageStack", env=env)
auth = AuthStack(app, "SecureToDoAuthStack", env=env)

# Only create compute stack if DEPLOY_COMPUTE environment variable is set
if os.getenv('DEPLOY_COMPUTE') == 'true':
    compute = ComputeStack(app, "SecureToDoComputeStack",
        storage_table_arn=storage.tasks_table.table_arn,
        cognito_pool_arn=auth.user_pool.user_pool_arn,
        env=env
    )

app.synth()
