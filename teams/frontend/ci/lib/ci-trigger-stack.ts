import { Stack, StackProps, StageProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  Step,
} from "aws-cdk-lib/pipelines";
import * as cdk from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";
import * as cloudtrail from "aws-cdk-lib/aws-cloudtrail";
import * as targets from "aws-cdk-lib/aws-events-targets";

import { S3Trigger } from "aws-cdk-lib/aws-codepipeline-actions";
import { AddEventSelectorOptions } from "aws-cdk-lib/aws-cloudtrail";

interface CiStackProps extends StageProps {
  stage: string;
}

// Docs at https://www.npmjs.com/package/@aws-cdk/pipelines

export class CiTriggerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const bucket = cdk.aws_s3.Bucket.fromBucketName(
      this,
      "CodePipelineAssetsBucket",
      `capstone-tusharf5-pipeline-assets-bucket-${props.stage}`
    );

    const trail = new cloudtrail.Trail(this, "S3AssetsCloudTrail");

    const options: AddEventSelectorOptions = {
      readWriteType: cloudtrail.ReadWriteType.WRITE_ONLY,
    };

    // Adds an event selector to the bucket
    trail.addS3EventSelector(
      [
        {
          bucket: bucket, // 'Bucket' is of type s3.IBucket,
          objectPrefix: `frontend/apps/bff-api`,
        },
      ],
      options
    );
    // argocd-apps-team-frontend
    const arn = `arn:aws:codepipeline:${props.env?.region}:${props.env?.account}:${props.stage}-argocd-apps-team-frontend`;

    bucket.onCloudTrailWriteObject("PipelineTrigger", {
      target: new targets.CodePipeline(
        cdk.aws_codepipeline.Pipeline.fromPipelineArn(
          this,
          "AppDevCiPipelineArn",
          arn
        )
      ),
    });
  }
}
