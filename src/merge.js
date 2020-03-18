const fs = require("fs");
const axios = require("axios");

let rawCases = fs.readFileSync("../data/us-cases.json");
let rawCounties = fs.readFileSync("../data/counties-new.json");

let jsonCases = JSON.parse(rawCases);
let jsonCounties = JSON.parse(rawCounties);

county_dict = {};

function construct_dates(county_index) {
  let date_dict = {};

  let start_date = new Date("1/1/2020");
  let end_date = new Date();

  let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

  let millitime;
  let dateObj;
  for (var i = 0; i < days; i++) {
    millitime = start_date.getTime() + 86400000 * i;
    dateObj = new Date(millitime);

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

    jsonCounties["features"][county_index]["properties"][key] = 0;
  }

  return date_dict;
}

function construct_county_dict() {
  for (let i = 0; i < jsonCounties["features"].length; i++) {
    jsonCounties["features"][i]["properties"]["total_cases"] = 0;
    jsonCounties["features"][i]["properties"]["date_ind"] = construct_dates(i);
    // construct_dates(i);
    // jsonCounties["features"][i]["properties"]["date_cumul"] = construct_dates();
    // construct_dates();

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

function append_county(caseObj) {
  let key = get_key_county_state(caseObj["county"], caseObj["province"]);
  let date_confirmation = caseObj["date_confirmation"];

  if (county_dict[key] !== undefined) {
    county_dict[key]["properties"]["total_cases"] += 1;
    county_dict[key]["properties"][date_confirmation] += 1;
    county_dict[key]["properties"]["date_ind"][date_confirmation] += 1;
  } else {
    console.log(key);
  }
}

function merge_county_cases() {
  for (let i = 0; i < jsonCases.length; i++) {
    append_county(jsonCases[i]);

    // if (jsonCases["features"][i]["properties"]["country"] === "United States") {
    //   await api_county_call(jsonCases["features"][i]);
    // } else {
    //   //Do nothing. We don't care about anyone else lol. jk. might implement for other countries later
    // }
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

  fs.writeFileSync("../data/counties-cases.json", data);
  fs.writeFileSync("../final_data/counties-cases.geojson", data);
}

function construct_cumulative() {
  for (let [key, value] of Object.entries(county_dict)) {
    let cumulative_count = 0;

    // for (let [date, count] of Object.entries(
    //   value["properties"]["date_cumul"]
    // )) {
    //   cumulative_count += count;
    //   value["properties"]["date_cumul"][date] = cumulative_count;
    // }

    let start_date = new Date("01/01/2020");
    let end_date = new Date();

    let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

    for (let i = 0; i < days; i++) {
      let millitime = start_date.getTime() + 86400000 * i;
      // let millitimeYes = start_date.getTime() + 86400000 * (i - 1);

      let dateObj = new Date(millitime);
      // let dateObjYes = new Date(millitimeYes);

      let date = "";
      let month = parseInt(dateObj.getMonth()) + 1;
      let year = dateObj.getFullYear();

      // let dateYes = "";
      // let monthYes = parseInt(dateObjYes.getMonth()) + 1;
      // let yearYes = dateObjYes.getFullYear();

      if (parseInt(dateObj.getDate()) < 10) {
        date = "0" + dateObj.getDate();
      } else {
        date = dateObj.getDate();
      }

      // if (parseInt(dateObjYes.getDate()) < 10) {
      //   dateYes = "0" + dateObjYes.getDate();
      // } else {
      //   dateYes = dateObjYes.getDate();
      // }

      if (month < 10) {
        month = "0" + month;
      }

      // if (monthYes < 10) {
      //   monthYes = "0" + monthYes;
      // }

      let displayDate = date + "." + month + "." + year;
      // let displayDateYes = dateYes + "." + monthYes + "." + yearYes;

      cumulative_count += value["properties"][displayDate];
      value["properties"][displayDate] = cumulative_count;
    }
  }
}

function main() {
  construct_county_dict();

  merge_county_cases();

  construct_cumulative();

  write_file();
}

main();
