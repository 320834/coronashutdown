let fs = require("fs");
let axios = require("axios");
let request = require("sync-request");

let rawCases = fs.readFileSync("data/cases.json");

let jsonCases = JSON.parse(rawCases);

let US_list = [];
let missing_list = [];

let time_start;
let time_end;

for (var i = 0; i < jsonCases.length; i++) {
  if (jsonCases[i]["country"] == "United States") {
    US_list.push(jsonCases[i]);
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

function api_call() {
  time_start = new Date();
  for (let i = 0; i < US_list.length; i++) {
    US_list[i]["county"] = "";

    let lat = US_list[i]["latitude"];
    let lon = US_list[i]["longitude"];
    let city = US_list[i]["city"];

    // console.log(lat + "\t" + lon);

    if (lat === "" || lon === "") {
      // missing_list.push(US_list[i]);
      if (city !== "") {
        US_list[i]["county"] = get_county(US_list[i]["city"]);
      }
    } else {
      axios
        .get(
          "https://geo.fcc.gov/api/census/area?lat=" +
            lat +
            "&lon=" +
            lon +
            "&format=json"
        )
        .then(function(res) {
          // console.log(res.data.results[0].county_name);
          US_list[i]["county"] = res.data.results[0].county_name;
        })
        .catch(function(err) {
          console.log(err);
        });

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
  }
}

api_call();

for (var i = 0; i < US_list.length; i++) {
  if (US_list[i]["county"] == "") {
    console.log(US_list[i]["ID"]);
  }
}

let data = JSON.stringify(US_list, null, 4);

fs.writeFileSync("debug_data/us-cases.json", data);

time_end = new Date();

console.log(time_end - time_start);
