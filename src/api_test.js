const axios = require('axios');

let lat = 41.8781;
let lon = -87.6298;
axios.get("https://geo.fcc.gov/api/census/area?lat=" + lat + "&lon=" + lon + "&format=json")
        .then(function(res){
            // console.log(res.data)

            // jsonBod = JSON.parse(res.data);

            console.log(res["data"]["results"][0]["county_name"] + "|" + res["data"]["results"][0]["state_name"])
        })
        .catch(function(err){
            console.log(err)
        })

// console.log(res.getBody('utf8'))

// jsonData = JSON.parse(res.getBody('utf8'));

// console.log(jsonData["results"][0]["county_name"] + "|" + jsonData["results"][0]["state_name"])