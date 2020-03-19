const fs = require("fs");

let rawCases = fs.readFileSync("../selenium_data/us-cases-1point3acres.json");
let rawStateAbbreviation = fs.readFileSync(
  "../misc_data/appreviations-states.json"
);

let jsonCases = JSON.parse(rawCases);
let jsonStateAbb = JSON.parse(rawStateAbbreviation);

let US_state_list = {};

function get_number_cases(obj) {
  let cases = obj["cases"];

  if (cases !== "Death") {
    cases = cases.split(".")[1];
    if (cases.includes("-")) {
      let top = cases.split("-")[1];
      let bottom = cases.split("-")[0];

      obj["cases"] = parseInt(top) - parseInt(bottom) + 1;
    } else {
      obj["cases"] = 1;
    }
  }
}

function create_state_list() {
  for (let [key, value] of Object.entries(jsonStateAbb)) {
    let obj = {
      Confirmed: 0,
      Deaths: 0
    };
    US_state_list[value] = obj;
  }
}

function pull_from_cases() {
  for (let i = 0; i < jsonCases.length; i++) {
    get_number_cases(jsonCases[i]);

    if (jsonStateAbb[jsonCases[i]["state"]] != undefined) {
      let state = jsonStateAbb[jsonCases[i]["state"]];

      if (jsonCases[i]["cases"] === "Death") {
        US_state_list[state]["Deaths"] += 1;
      } else {
        US_state_list[state]["Confirmed"] += jsonCases[i]["cases"];
      }
    }
  }
}

function write_file() {
  let data = JSON.stringify(US_state_list, null, 4);

  fs.writeFileSync("../misc_data/state_confirmation_deaths.json", data);
}

function main() {
  create_state_list();

  pull_from_cases();

  write_file();
}

main();
