let fs = require("fs");
var str = "New York City";

let name = str.split(" City");

console.log(name);

let rawCases = fs.readFileSync("../data/cases.json");
let jsonCases = JSON.parse(rawCases);

let stuff = [];
for (var i = 0; i < jsonCases.length; i++) {
  if (jsonCases[i]["country"] === "United States") {
    stuff.push(jsonCases[i]);
  }
}

console.log(stuff.length);
