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

    const trigger = new pipelines.CodeBuildStep("update-files-and-commit", {
      input: sourceArtifact,
      additionalInputs: {
        runtime_config: s3Source,
      },
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
        `mkdir repo`,
        `pwd`,
        `git clone --depth 1 -b ${props.branch} https://github.com/tusharf5/capstone-project-app-of-apps.git repo`,
        `ls`,
        `pwd`,
        `mv runtime_config/config.json repo/teams/app-devs`,
        `cd repo/teams/app-devs`,
        `pwd`,
        `ls`,
        `cat config.json`,
        `yarn install`,
        `node image-updater.js`,
        `rm config.json`,
        `git add .`,
        `git commit -m "Updated By Pipeline"`,
        `git push ${props.branch}`,
      ],
    });

    pipeline.addWave("update-files-and-commit").addPre(trigger);
  }
}
