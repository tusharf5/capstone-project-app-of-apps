const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const configFile = require("./config.json");

const required_env_variables = [
  {
    configPath: ["bffApi", "dockerImageURI"],
    filePath: "./dev/templates/bff-api/app.yaml",
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

    let configRef = configFile;

    for (let field of toReplace.configPath) {
      configRef = configRef[field];
    }

    console.log(configRef);

    ref[toReplace.key] = configRef;

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
