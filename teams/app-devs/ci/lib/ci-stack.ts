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

    const sourceArtifact = CodePipelineSource.s3(
      bucket,
      `${props.stage}/service-a/config.json`,
      {
        trigger: S3Trigger.EVENTS,
        actionName: "retreive-latest-config",
      }
    );

    const pipeline = new CodePipeline(this, "synth-sources", {
      pipelineName: `${props.stage}-app-of-apps-pipeline`,
      synth: new ShellStep("Synth", {
        input: sourceArtifact,
        // additionalInputs: [],
        installCommands: ['echo "Synth installCommands"'],
        commands: ['echo "Synth commands"', "ls"],
      }),
    });

    const trigger = new pipelines.ShellStep("update-files-and-commit", {
      commands: ['echo " I will trigger another pipeline "'],
    });

    // pipeline
    //   .addWave("manual-approval")
    //   .addPre(new pipelines.ManualApprovalStep("manual-approval"));

    const triggerWave = pipeline.addWave("trigger-next");

    triggerWave.addPost(trigger);

    // // Add our CodeBuild project to our CodePipeline
    // const buildAction = new pipelines.CodeBuildStep("", {
    //   input: CodePipelineSource.gitHub(
    //     "tusharf5/capstone-project-apps-monorepo",
    //     props.branch,
    //     {
    //       authentication: cdk.SecretValue.secretsManager(
    //         "capstone-github-token"
    //       ),
    //     }
    //   ),
    //   commands: [],
    // });

    // CodeCommit repository that contains the Dockerfile used to build our ECR image:
    // code_repo = new codecommit.Repository(this, "codeRepository", {
    //   repositoryName: "container-image-repo",
    // });
  }
}
