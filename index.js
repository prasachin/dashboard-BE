const fs = require("fs");
const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();

async function fetchPullRequestData(id) {
  const url = `https://api.github.com/repos/Openlake/GitStartedWithUs/pulls/${id}`;
  const token = process.env.GITHUB_TOKEN;
  const fetch = (await import("node-fetch")).default;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `token ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { message: "Not Found" };
    }
    throw new Error(
      `Failed to fetch: ${response.status} ${response.statusText}`
    );
  }

  return await response.json();
}

async function processPullRequests() {
  let id = 1;
  let userData = {};

  while (true) {
    try {
      const data = await fetchPullRequestData(id);
      if (data.message === "Not Found") {
        console.log("No more pull requests found");
        break;
      }
      if (data.state === "closed" && data.merged) {
        const login = data.user.login;
        const points = 1;
        if (login === "Asp-Codes" || login === "kritiarora2003") {
          id++;
          continue;
        }
        if (!userData[login]) {
          userData[login] = { points: points };
        } else {
          userData[login].points += points;
        }
      }
      id++;
    } catch (error) {
      console.error(`Error fetching pull request ${id}:`, error);
      break;
    }
  }

  const userDataJSON = JSON.stringify(userData, null, 2);
  fs.writeFileSync("userData.json", userDataJSON);
  return userData;
}

app.use(cors());

app.get("/", async (req, res) => {
  try {
    let result = await processPullRequests();
    res.header("Content-Type", "application/json");
    res.send(result);
  } catch (error) {
    console.error("Error processing pull requests:", error);
    res.status(500).send({ error: "Internal Server Error" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
