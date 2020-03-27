let request = require("sync-request");
let csv = require("csvtojson")
let fs = require("fs")

let list_cases = []

function main()
{
    let res = request("GET", 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv');

    let data = res.getBody("utf-8");

    csv()
        .fromString(data)
        .then((jsonObj)=>{
            list_cases = jsonObj
            // console.log("Finish pulling")
            let cum = 0;
            for(let i = 0; i < list_cases.length; i++)
            {
                cum += parseInt(list_cases[i]["cases"]);
            }

            console.log(cum)
        })

}

main()