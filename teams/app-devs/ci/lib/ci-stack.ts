import { Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import {
  CodePipeline,
  CodePipelineSource,
  ShellStep,
  Step,
} from "aws-cdk-lib/pipelines";
import * as cdk from "aws-cdk-lib";
import * as pipelines from "aws-cdk-lib/pipelines";

import { S3Trigger } from "aws-cdk-lib/aws-codepipeline-actions";

interface CiStackProps extends StackProps {
  stage: string;
  branch: string;
}

// Docs at https://www.npmjs.com/package/@aws-cdk/pipelines

export class CiStack extends Stack {
  constructor(scope: Construct, id: string, props: CiStackProps) {
    super(scope, id, props);

    const bucket = cdk.aws_s3.Bucket.fromBucketName(
      this,
      "CodePipelineAssetsBucket",
      "capstone-tusharf5-pipeline-assets-bucket"
    );

    const sourceArtifact = CodePipelineSource.gitHub(
      "tusharf5/capstone-project-app-of-apps",
      props.branch,
      {
        authentication: cdk.SecretValue.secretsManager("capstone-github-token"),
      }
    );

    const s3Source = CodePipelineSource.s3(
      bucket,
      `${props.stage}/service-a/config.zip`,
      {
        trigger: S3Trigger.EVENTS,
        actionName: "retreive-latest-config",
      }
    );

    const pipeline = new CodePipeline(this, "synth-sources", {
      pipelineName: `${props.stage}-app-of-apps-app-devs-pipeline`,
      synth: new ShellStep("Synth", {
        input: sourceArtifact,
        additionalInputs: {
          "config.zip": s3Source,
        },
        commands: [
          'echo "Synth commands"',
          "ls",
          "cd teams/app-devs/ci",
          "yarn install",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "teams/app-devs/ci/cdk.out",
      }),
    });

    const trigger = new pipelines.ShellStep("update-files-and-commit", {
      additionalInputs: {
        "config.zip": s3Source,
      },
      commands: [`echo "I will trigger another pipeline "`, "ls"],
    });

    pipeline.addWave("update-files-and-commit").addPre(trigger);
  }
}
