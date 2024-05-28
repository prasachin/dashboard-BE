const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();

// app.use(express.static("dist"));
async function fetchPullRequestData(id) {
  const url = `https://api.github.com/repos/Openlake/GitStartedWithUs/pulls/${id}`;

  const fetch = (await import("node-fetch")).default;

  const response = await fetch(url, {
    headers: {
      mode: "cors",
      method: "GET",
      "Content-Type": "application/json",
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  });
  if (response.status === 404) {
    return {
      message: "Not Found",
    };
  }
  return await response.json();
}

async function processPullRequests() {
  let id = 1;
  let userData = {};

  while (true && id < 60) {
    const data = await fetchPullRequestData(id);
    if (data.message === "Not Found") {
      console.log("No more pull requests found");
      break;
    }
    if (data.state === "closed" && data.merged) {
      const login = data.user.login;
      const points = 1;
      if (login == "Asp-Codes" || login == "kritiarora2003") {
        id++;
        continue;
      }
      if (!userData[login]) {
        userData[login] = {
          points: points,
        };
      } else {
        userData[login].points += points;
      }
    }
    id++;
  }
  const userDataJSON = JSON.stringify(userData, null, 2);
  fs.writeFileSync("userData.json", userDataJSON);
  return userData;
}
app.use(cors());

app.get("/", async (req, res) => {
  let result = await processPullRequests();
  res.header("Content-Type", "application/json");
  res.send(result);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
