const { spawn } = require("child_process");

const gitUrl = "https://github.com/mojocn/contentant";
const retryCount = 3;
const contentDir = "_posts";
async function runBashCommand(command) {
  new Promise((resolve, reject) => {
    const child = spawn(command, [], { shell: true });
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (data) => process.stdout.write(data));
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (data) => process.stderr.write(data));
    child.on("close", function (code) {
      if (code === 0) {
        resolve(void 0);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function syncContentFromGit(contentDir) {
  const cmdLines = `
      if [ -d  "${contentDir}" ];
        then
          cd "${contentDir}"; git pull;
        else
          git clone --depth 1 --single-branch ${gitUrl} ${contentDir};
      fi
    `;
  for (let i = 0; i < retryCount; i++) {
    try {
      await runBashCommand(cmdLines);
      break;
    } catch (err) {
      console.error(err);
      console.log("retrying...");
    }
  }
}

(async function () {
  // your code using await
  await syncContentFromGit(contentDir);
})();
