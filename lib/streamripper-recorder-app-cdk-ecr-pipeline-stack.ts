import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as iam from 'aws-cdk-lib/aws-iam';

export class StreamripperRecorderAppCdkEcrPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create an Amazon ECR repository
    const repository = new ecr.Repository(this, 'ECRRepository', {
      repositoryName: 'streamripper-repository'
    });

    // Create a CodeBuild project
    const project = new codebuild.Project(this, 'CodeBuildProject', {
      projectName: 'Streamripper-project',
      source: codebuild.Source.gitHub({
        owner: 'tommcm1200',
        repo: 'streamripper-recorder-app',
        // webhook: true, // Enable webhook to trigger builds automatically
        // webhookFilters: [
        //   codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs('master')
        // ],        
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
        privileged: true,
        environmentVariables: {
          AWS_DEFAULT_REGION: { value: this.region },
          AWS_ACCOUNT_ID: { value: this.account },
          IMAGE_TAG: { value: 'LATEST' },
          IMAGE_REPO_NAME: { value: repository.repositoryName },
        }
      },
      // https://docs.aws.amazon.com/codebuild/latest/userguide/sample-docker.html#sample-docker-files
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          pre_build: {
            commands: [
              'echo Logging in to Amazon ECR...',
              'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com'
            ]
          },
          build: {
            commands: [
              'echo Build started on `date`',
              'echo Building the Docker image...',          
              'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
              'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG'
            ]
          },
          post_build: {
            commands: [
              'echo Build completed on `date`',
              'echo Pushing the Docker image...',
              'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG'
            ]
          }            
        }
      })
    });

    // Grant CodeBuild access to the ECR repository
    repository.grantPullPush(project.role as iam.IRole);

  }
}