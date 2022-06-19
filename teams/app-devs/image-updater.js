const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");

const required_env_variables = [
  {
    envVarName: "SERVICE_A_DOCKER_IMAGE",
    filePath: "./dev/templates/service-a/app.yaml",
    keyPath: ["spec", "template", "spec", "containers", 0],
    key: "image",
  },
];

try {
  for (let toReplace of required_env_variables) {
    const doc = yaml.load(
      fs.readFileSync(path.join(__dirname, toReplace.filePath), "utf8")
    );

    let ref = doc;
    for (let field of toReplace.keyPath) {
      ref = ref[field];
    }

    if (!process.env[toReplace.envVarName]) {
      throw new Error(
        `${toReplace.envVarName} is not present. Curr Value is ${
          process.env[toReplace.envVarName]
        }`
      );
    }

    ref[toReplace.key] = process.env[toReplace.envVarName];

    fs.writeFileSync(
      path.join(__dirname, toReplace.filePath),
      yaml.dump(doc, {lineWidth: -1}),
      {
        encoding: "utf-8",
      }
    );
  }
} catch (e) {
  console.log(e);
}
