class server {
  constructor() {
    const app = express();
    const cors = require("cors");
    const path = require("path");
    app.use(express.json());
    app.use(cors());
    this.app = app;
    this.port = process.env.PORT || 3001;
  }

  addendpoints(endpoints) {
    for (let i = 0; i < endpoints.length; i++) {
      let endpoint = endpoints[i];
      let method = endpoint.method;
      let path = endpoint.path;
      let handler = endpoint.handler;
      this.app[method](path, handler);
    }
  }
  listen() {
    this.app.listen(this.port, () => {
      console.log(`Server is running on port ${this.port}`);
    });
  }
}

const fs = require("fs");
const express = require("express");

const endpoints = [
  {
    method: "post",
    path: "/cowtubeapi",
    handler: (req, res) => {
      ytapi(req, res);
    },
  },
];

function ytapi(req, res) {
  let q = req.body.q;
  if (!q) {
    q = "cow";
  }
  //variable for your API_KEY
  const YOUTUBE_API_KEY = process.env.ytapi;
  //url from YouTube docs modified for my random term and API key,
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=100&q=${encodeURIComponent(q)}&key=${YOUTUBE_API_KEY}`;
  //fetch function following the aforementioned process
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      let i = 0;
      let item = data.items[Math.floor(Math.random() * data.items.length)];
      while (
        item.snippet.title.includes("#shorts") ||
        item.snippet.description.includes("#shorts")
      ) {
        item = data.items[Math.floor(Math.random() * data.items.length)];
        i++;
        if (i > 100) {
          break;
        }
      }
      res.send(JSON.stringify({ id: item.id.videoId, data: item }));
    });
}

const app = new server();
app.addendpoints(endpoints);
app.listen();
