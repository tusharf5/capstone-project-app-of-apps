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
      synth: new pipelines.CodeBuildStep("Synth", {
        input: s3Source,
        rolePolicyStatements: [
          new cdk.aws_iam.PolicyStatement({
            resources: [
              `arn:aws:secretsmanager:${props.env!.region}:${
                props.env!.account
              }:secret:github-ssh-key-MD2h9J`,
              `arn:aws:secretsmanager:${props.env!.region}:${
                props.env!.account
              }:secret:github-ssh-key-public-KaBZ7z`,
            ],
            actions: [
              "secretsmanager:GetSecretValue",
              "secretsmanager:GetResourcePolicy",
              "secretsmanager:DescribeSecret",
              "secretsmanager:ListSecretVersionIds",
            ],
            effect: cdk.aws_iam.Effect.ALLOW,
          }),
        ],
        commands: [
          `build_ssh_key=$(aws secretsmanager get-secret-value --secret-id "github-ssh-key" --output text --query SecretString)`,
          `mkdir -p ~/.ssh`,
          `echo "$build_ssh_key" > ~/.ssh/id_rsa`,
          `chmod 600 ~/.ssh/id_rsa`,
          `ssh-keygen -F github.com || ssh-keyscan github.com >>~/.ssh/known_hosts`,
          `git config --global url."git@github.com:".insteadOf "https://github.com/"`,
          `git config --global user.email "codepipeline@amazon.com"`,
          `git config --global user.name "CodePipeline"`,
          `mkdir repo`,
          `git clone --depth 1 -b ${props.branch} https://github.com/tusharf5/capstone-project-app-of-apps.git repo`,
          "cd repo/teams/app-devs/ci",
          "yarn install",
          "npx cdk synth",
        ],
        primaryOutputDirectory: "repo/teams/app-devs/ci/cdk.out",
      }),
    });

    const trigger = new pipelines.CodeBuildStep("update-files-and-commit", {
      input: s3Source,
      rolePolicyStatements: [
        new cdk.aws_iam.PolicyStatement({
          resources: [
            `arn:aws:secretsmanager:${props.env!.region}:${
              props.env!.account
            }:secret:github-ssh-key-MD2h9J`,
            `arn:aws:secretsmanager:${props.env!.region}:${
              props.env!.account
            }:secret:github-ssh-key-public-KaBZ7z`,
          ],
          actions: [
            "secretsmanager:GetSecretValue",
            "secretsmanager:GetResourcePolicy",
            "secretsmanager:DescribeSecret",
            "secretsmanager:ListSecretVersionIds",
          ],
          effect: cdk.aws_iam.Effect.ALLOW,
        }),
      ],
      commands: [
        `build_ssh_key=$(aws secretsmanager get-secret-value --secret-id "github-ssh-key" --output text --query SecretString)`,
        `mkdir -p ~/.ssh`,
        `echo "$build_ssh_key" > ~/.ssh/id_rsa`,
        `chmod 600 ~/.ssh/id_rsa`,
        `ssh-keygen -F github.com || ssh-keyscan github.com >>~/.ssh/known_hosts`,
        `git config --global url."git@github.com:".insteadOf "https://github.com/"`,
        `git config --global user.email "codepipeline@amazon.com"`,
        `git config --global user.name "CodePipeline"`,
        `mkdir repo`,
        `git clone --depth 1 -b ${props.branch} https://github.com/tusharf5/capstone-project-app-of-apps.git repo`,
        `mv config.json repo/teams/app-devs`,
        `cd repo/teams/app-devs`,
        `yarn install`,
        `node image-updater.js`,
        `git add ${props.stage}`,
        `git commit -m "Updated By Pipeline" || echo "Nothing to commit"`,
        `git push origin ${props.branch} || echo "Nothing to push"`,
      ],
    });

    pipeline.addWave("update-files-and-commit").addPre(trigger);
  }
}
