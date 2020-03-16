const fs = require("fs");
const axios = require("axios");

let rawCases = fs.readFileSync("data/cases.json");
let rawCounties = fs.readFileSync("data/counties-new.json");

let jsonCases = JSON.parse(rawCases);
let jsonCounties = JSON.parse(rawCounties);

county_dict = {};

function construct_dates() {
  let date_dict = {};

  let start_date = new Date("1/1/2020");
  let end_date = new Date();

  var days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

  for (var i = 0; i < days; i++) {
    let millitime = start_date.getTime() + 86400000 * i;
    let dateObj = new Date(millitime);

    let date = "";
    let month = parseInt(dateObj.getMonth()) + 1;
    let year = dateObj.getFullYear();

    if (parseInt(dateObj.getDate()) < 10) {
      date = "0" + dateObj.getDate();
    } else {
      date = dateObj.getDate();
    }

    if (month < 10) {
      month = "0" + month;
    }

    let key = date + "." + month + "." + year;
    let value = 0;
    date_dict[key] = value;
  }

  return date_dict;
}

function construct_county_dict() {
  for (let i = 0; i < jsonCounties["features"].length; i++) {
    jsonCounties["features"][i]["properties"]["total_cases"] = 0;
    jsonCounties["features"][i]["properties"]["date_ind"] = construct_dates();
    jsonCounties["features"][i]["properties"]["date_cumul"] = construct_dates();

    let key =
      jsonCounties["features"][i]["properties"]["COUNTY"] +
      "|" +
      jsonCounties["features"][i]["properties"]["STATE"];
    let value = jsonCounties["features"][i];

    county_dict[key] = value;
  }
}

function get_key_county_state(county, state) {
  if (county === "Norfolk City") {
    county = "Norfolk";
  }

  if (county === "St. Louis City") {
    county = "St. Louis";
  }

  return county + "|" + state;
}

async function append_county(res, caseObj) {
  let key = get_key_county_state(
    res["data"]["results"][0]["county_name"],
    res["data"]["results"][0]["state_name"]
  );
  let date_confirmation = caseObj["properties"]["date_confirmation"];

  if (county_dict[key] !== undefined) {
    county_dict[key]["properties"]["total_cases"] += 1;
    county_dict[key]["properties"]["date_ind"][date_confirmation] += 1;
    county_dict[key]["properties"]["date_cumul"][date_confirmation] += 1;
  } else {
    console.log(key);
  }
}

async function api_county_call(obj) {
  let lat = obj["geometry"]["coordinates"][1];
  let lon = obj["geometry"]["coordinates"][0];

  if (lat !== undefined || lon !== undefined) {
    axios
      .get(
        "https://geo.fcc.gov/api/census/area?lat=" +
          lat +
          "&lon=" +
          lon +
          "&format=json"
      )
      .then(function(res) {
        //console.log(res["data"]["results"][0]["county_name"] + "|" + res["data"]["results"][0]["state_name"])
        append_county(res, obj);
      })
      .catch(function(err) {
        console.log(err);
      });
  }
}

async function merge_county_cases() {
  for (let i = 0; i < jsonCases["features"].length; i++) {
    // let obj = jsonCases["features"][i];

    //Check if in united states
    //Do api call to figure out county state
    //Add to total_cases
    //Add to date_ind and date_cum

    if (jsonCases["features"][i]["properties"]["country"] === "United States") {
      await api_county_call(jsonCases["features"][i]);
    } else {
      //Do nothing. We don't care about anyone else lol. jk. might implement for other countries later
    }
  }
}

function write_file() {
  let features = [];

  for (let [key, value] of Object.entries(county_dict)) {
    features.push(value);
  }

  let jsonWrite = {
    type: "FeatureCollection",
    features: features
  };

  let data = JSON.stringify(jsonWrite);

  fs.writeFileSync("data/counties-cases.json", data);
}

function construct_cumulative() {
  for (let [key, value] of Object.entries(county_dict)) {
    let cumulative_count = 0;

    for (let [date, count] of Object.entries(
      value["properties"]["date_cumul"]
    )) {
      cumulative_count += count;
      value["properties"]["date_cumul"][date] = cumulative_count;
    }
  }
}

function main() {
  construct_county_dict();

  merge_county_cases();

  setTimeout(function() {
    construct_cumulative();

    write_file();
    // console.log(county_dict["Bergen|New Jersey"])
  }, 15000);
}

main();
