const axios = require("axios");
const fs = require("fs");
const csv = require("csvtojson/v2");

axios
  .get(
    "https://raw.githubusercontent.com/beoutbreakprepared/nCoV2019/master/latest_data/outside_Hubei.data.18032020T013142.csv"
  )
  .then(function(res) {
    fs.writeFileSync("../data/cases.csv", res.data);
    console.log("Finish fetching from source");
    csv()
      .fromFile("../data/cases.csv")
      .then(jsonObj => {
        let str = JSON.stringify(jsonObj);
        fs.writeFileSync("../data/cases.json", str);
        console.log("Finish converting to json");
      });
  })
  .catch(function(err) {
    console.log(err);
  });

// csv()
//   .fromFile("../data/cases.csv")
//   .then(jsonObj => {
//     console.log(jsonObj);
//     // let str = JSON.stringify(jsonObj);
//     // fs.writeFileSync("../data/cases.json", str);
//     // console.log("Finish converting to json");
//   });

// let json = csvToJson.fieldDelimiter(";").getJsonFromCsv("../data/test.csv");

// console.log(json);
