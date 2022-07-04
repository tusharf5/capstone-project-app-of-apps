import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

import { CiTriggerStack } from "./ci-trigger-stack";

interface StageProps extends cdk.StageProps {
  stage: string;
}

export class CiTriggerStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    new CiTriggerStack(this, "frontend-ci-trigger-stack", props);
  }
}
