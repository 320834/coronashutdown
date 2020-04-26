/**
 * Pull data from nytimes and preps into json format for merge
 */

let request = require("sync-request");
let csv = require("csvtojson")
let fs = require("fs")

//Global Variables
let list_cases = null;
let write_cases = []

async function parse_csv_to_json(csv_str)
{
    csv()
        .fromString(csv_str)
        .then((jsonObj)=>{
            // console.log(JSON.stringify(jsonObj, null, 4))

            fs.writeFileSync("../ny_times_data/nytimes_cases.json", JSON.stringify(jsonObj, null, 4))
        })
}



/**
 * Calling function
 */
function main()
{
    let res = request("GET", 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv');

    parse_csv_to_json(res.getBody("utf-8"))
}

main()