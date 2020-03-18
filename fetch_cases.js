const axios = require("axios");
const fs = require("fs");

axios
  .get("https://raw.githubusercontent.com/jasonlzhu/COVID/master/outsidehbei")
  .then(function(res) {
    // console.log(res.data);

    let data = JSON.stringify(res.data);

    fs.writeFileSync("data/cases.json", data);
  })
  .catch(function(err) {
    console.log(err);
  });
