#!/bin/env node

// MODULES
const express = require("express");
const http = require("http");
const { join } = require("path");

// CONFIG
let config;
try {
  config = require("../config/general.json");
} catch {
  throw new Error("There's not general.json. Make a general.json in \"$proyect/config/general.json\"");
}


// VALIDATE CONFIG PROPERTIES
if(typeof config.port !== "number" && config.port !== 0) 
  throw new TypeError("Config Error: port is invalid.");

if(typeof config.urlsJson !== "string")
  throw new TypeError("Config Error: urlsJson is invalid.");

if(typeof config.baseRoute !== "string")
  throw new TypeError("Config Error: baseRoute is invalid.");


// GET URL JSON
const urlJson = require(join(__dirname, "../config", config.urlsJson));

/** @type {string} */
const baseRoute = config.baseRoute;


// MAP ALL URLS TO ONE OBJECT WITH THEM

/** @type {{ [route: string]: string[] }} */
const urls = {};

/**
 * @param {object} obj
 * @param {string} [route]
*/
function mapUrlJson(obj, route = "/") {
  if(typeof obj !== "object")
    throw new TypeError("Url Error: invalid syntax on " + config.urlsJson + " on " + route);

  if(Array.isArray(obj)) {
    urls[route] = Object.freeze(obj);
    return;
  }

  for(let url of Object.keys(obj)) {
    // Normalize paths
    url = url.startsWith("/") ? 
      url.slice(1) : 
      url;
    route = route.endsWith("/") ? 
      route.slice(0, route.length - 1) : 
      route;

    // Recursive map
    mapUrlJson(obj[url], `${route}/${url}`);
  }
}

// Initialize map
mapUrlJson(urlJson, baseRoute);

console.log(urls);

// SETUP EXPRESS
const app = express();
const server = http.createServer(app);
const PORT = config.port > 0 ? 
  (process.env.PORT || config.port) : 
  -config.port;

// SET ALL API URLS
for(let uri of Object.keys(urls)) {
  const list = urls[uri];
  const range = list.length;
  
  app.get(uri, (_req, res) => {
    const n = Math.floor(Math.random() * range);
    res
      .status(200)
      .type("json")
      .send({
        url: list[n]
      });
  });
}

app.use((req, res) => {
  res.sendStatus(404);
});

// Listen
server.listen(PORT, () => {
  console.log("Listening on", PORT);
});

// CATCH ERRORS
server.on("error", (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(PORT + ' requires elevated privileges');
      process.exit(1);

    case 'EADDRINUSE':
      console.error(PORT + ' is already in use');
      process.exit(1);
      
    default:
      throw error;
  }
});
