#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import {CiStack} from "../lib/ci-stack";
import {CiTriggerStack} from "../lib/ci-trigger-stack";

const app = new cdk.App();

if (!process.env.CDK_DEFAULT_ACCOUNT) {
  throw new Error("`CDK_DEFAULT_ACCOUNT` environment variable is undefined.");
}

if (!process.env.CDK_DEFAULT_REGION) {
  throw new Error("`CDK_DEFAULT_REGION` environment variable is undefined.");
}

const environments = {
  dev: {
    name: "dev",
    region: "us-west-2",
  },
  test: {
    name: "test",
    region: "us-east-1",
  },
  prod: {
    name: "prod",
    region: "us-east-2",
  },
};

const devStack = new CiStack(app, "argocd-apps-team-frontend-dev", {
  stage: environments.dev.name,
  env: {
    region: environments.dev.region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  branch: "main",
});

// new CiTriggerStack(app, "trigger-app-of-apps-apps-devs-ci-dev", {
//   stage: environments.dev.name,
//   env: {
//     region: environments.dev.region,
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//   },
// }).addDependency(
//   devStack,
//   "Depends on codepipeline defined in this stack to be built"
// );

// new CiStack(app, "app-of-apps-apps-devs-ci-test", {
//   stage: environments.test.name,
//   env: {
//     region: environments.test.region,
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//   },
//   branch: "test",
// });

// new CiStack(app, "app-of-apps-apps-devs-ci-prod", {
//   stage: environments.prod.name,
//   env: {
//     region: environments.prod.region,
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//   },
//   branch: "prod",
// });

app.synth();
