const yaml = require("js-yaml");
const path = require("path");
const fs = require("fs");
const configFile = require("./config.json");

const required_env_variables = [
  {
    configPath: ["bffApi", "dockerImageURI"],
    kind: "Deployment",
    filePath: "./dev/templates/bff-api/app.yaml",
    keyPath: ["spec", "template", "spec", "containers", 0],
    key: "image",
  },
];

try {
  for (let toReplace of required_env_variables) {
    const docs = yaml.loadAll(
      fs.readFileSync(path.join(__dirname, toReplace.filePath), "utf8")
    );

    console.log(docs.length);

    let start = true;

    for (let doc of docs) {
      let ref = doc;

      if (!doc) {
        continue;
      }

      if (start) {
        fs.writeFileSync(path.join(__dirname, toReplace.filePath), `---\n`, {
          encoding: "utf-8",
        });
      } else {
        fs.appendFileSync(path.join(__dirname, toReplace.filePath), `---\n`, {
          encoding: "utf-8",
        });
      }

      start = false;

      if (doc["kind"] !== toReplace.kind) {
        fs.appendFileSync(
          path.join(__dirname, toReplace.filePath),
          yaml.dump(doc, {lineWidth: -1}),
          {
            encoding: "utf-8",
          }
        );
        continue;
      }

      for (let field of toReplace.keyPath) {
        ref = ref[field];
      }

      let configRef = configFile;

      for (let field of toReplace.configPath) {
        configRef = configRef[field];
      }

      if (configRef) {
        ref[toReplace.key] = configRef;
      }

      fs.appendFileSync(
        path.join(__dirname, toReplace.filePath),
        yaml.dump(doc, {lineWidth: -1}),
        {
          encoding: "utf-8",
        }
      );
    }
  }
} catch (e) {
  console.log(e);
}
