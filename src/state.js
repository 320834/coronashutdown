const fs = require("fs");

let rawState = fs.readFileSync("../data/states.json");
let rawCounties = fs.readFileSync("../data/counties.json");

let jsonState = JSON.parse(rawState);
let jsonCounty = JSON.parse(rawCounties);

let state_dict = {};

function construct_state() {
  states = jsonState["features"];
  for (var i = 0; i < states.length; i++) {
    if (states[i]["properties"] != undefined) {
      // console.log(states[i]['properties']["NAME"] + " " + states[i]['properties']['STATE'])
      let id = states[i]["properties"]["STATE"];
      let name = states[i]["properties"]["NAME"];
      state_dict[id] = name;
    }
  }
}

function map_county_state() {
  // var features = [];
  for (var i = 0; i < jsonCounty["features"].length; i++) {
    let state_name =
      state_dict[jsonCounty["features"][i]["properties"]["STATE"]];

    jsonCounty["features"][i]["properties"]["STATE"] = state_name;

    let county_name = jsonCounty["features"][i]["properties"]["NAME"];

    jsonCounty["features"][i]["properties"]["COUNTY"] = county_name;

    // if (state_name === "Puerto Rico") {
    // } else {
    //   features.push(jsonCounty["features"][i]);
    // }
  }

  // jsonCounty = {
  //   type: "FeatureCollection",
  //   features: features
  // };
}

function write_data() {
  let data = JSON.stringify(jsonCounty);

  fs.writeFileSync("../data/counties-new.json", data);
}

function main() {
  construct_state();

  map_county_state();

  write_data();
}

main();
