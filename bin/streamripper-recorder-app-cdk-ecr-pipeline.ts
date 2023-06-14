#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StreamripperRecorderAppCdkEcrPipelineStack } from '../lib/streamripper-recorder-app-cdk-ecr-pipeline-stack';

const app = new cdk.App();
new StreamripperRecorderAppCdkEcrPipelineStack(app, 'StreamripperRecorderAppCdkEcrPipelineStack');
