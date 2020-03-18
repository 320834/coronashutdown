let fs = require("fs");
let axios = require("axios");
let request = require("sync-request");

let rawCases = fs.readFileSync("../data/cases.json");
let rawCases_US = fs.readFileSync("../data/us-cases.json");

let jsonCases = JSON.parse(rawCases);
let jsonUS = JSON.parse(rawCases_US);

let US_list = [];
let missing_list = [];

let visited_us_cases_dict = {};

let time_start;
let time_end;

function add_US_list() {
  for (var i = 0; i < jsonCases.length; i++) {
    if (jsonCases[i]["country"] == "United States") {
      US_list.push(jsonCases[i]);
    }
  }
}

function build_visited_list() {
  for (let i = 0; i < jsonUS.length; i++) {
    visited_us_cases_dict[jsonUS[i]["ID"] + ""] = jsonUS[i];
  }
}

function get_county(str) {
  if (str.includes("County")) {
    let name = str.split(" County");

    return name[0];
  } else if (str.includes("City")) {
    let name = str.split(" City");

    return name[0];
  }
}

function api_call(lat, lon, i) {
  let res = request(
    "GET",
    "https://geo.fcc.gov/api/census/area?lat=" +
      lat +
      "&lon=" +
      lon +
      "&format=json"
  );

  let jsonObj = JSON.parse(res.getBody("utf-8"));

  console.log(jsonObj.results[0].county_name);

  US_list[i]["county"] = jsonObj.results[0].county_name;
}

function get_county_loop() {
  time_start = new Date();
  for (let i = 0; i < US_list.length; i++) {
    US_list[i]["county"] = "";

    let lat = US_list[i]["latitude"];
    let lon = US_list[i]["longitude"];
    let city = US_list[i]["city"];
    // console.log(lat + "\t" + lon);
    if (visited_us_cases_dict[US_list[i]["ID"] + ""] !== undefined) {
      //Do nothing. Already found

      //Check if county is there
      if (visited_us_cases_dict[US_list[i]["ID"] + ""]["county"] == "") {
        if (lat === "" || lon === "") {
          console.log("Already in US: " + US_list[i]["city"]);
          US_list[i]["county"] = get_county(US_list[i]["city"]);
        } else {
          api_call(lat, lon, i);
        }
      } else {
        US_list[i]["county"] =
          visited_us_cases_dict[US_list[i]["ID"] + ""]["county"];
      }
    } else if (lat === "" || lon === "") {
      // missing_list.push(US_list[i]);
      if (city !== "") {
        US_list[i]["county"] = get_county(US_list[i]["city"]);
      }
    } else {
      api_call(lat, lon, i);
    }
  }
}

function write_file_us_cases() {
  for (var i = 0; i < US_list.length; i++) {
    if (US_list[i]["county"] == "") {
      console.log(US_list[i]["ID"]);
    }
  }

  let data = JSON.stringify(US_list, null, 4);

  fs.writeFileSync("../data/us-cases.json", data);

  time_end = new Date();

  console.log(time_end - time_start);
}

build_visited_list();

// console.log(visited_us_cases_dict);

add_US_list();

get_county_loop();

write_file_us_cases();
