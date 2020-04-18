const fs = require("fs");
let rawCases = fs.readFileSync("../ny_times_data/ny-times.json");

let json_cases = JSON.parse(rawCases);

let date = "2020-04-16";
let county_dict = {}

let final_arr = []

function run()
{
    for(let i = 0; i < json_cases.length; i++)
    {
        let obj = json_cases[i];
        let county = obj["county"];
        let state = obj["state"];
        let key = county + "|" + state;

        if(date == obj["date"])
        {
            if(county_dict[key] == undefined)
            {
                let new_obj = {
                    county: county,
                    state: state,
                    cases: 0,
                    deaths: 0,
                    ratio: 0
                }

                if(obj["cases"] == "Death")
                {
                    new_obj["deaths"] += 1;
                }
                else
                {
                    new_obj["cases"] += obj["cases"]
                }

                county_dict[key] = new_obj
            }
            else
            {
                if(obj["cases"] == "Death")
                {
                    county_dict[key]["deaths"] += 1
                }
                else
                {
                    county_dict[key]["cases"] += obj["cases"]
                }
            }
        }
        
    }
}

function get_ratio()
{
    for(let [key,value] of Object.entries(county_dict))
    {
        value["ratio"] = value["deaths"]/value["cases"];

        final_arr.push(value);
    }
}

function compare(a,b)
{
    let comparison = 0
    if(a["ratio"] <= b["ratio"])
    {
        comparison = 1;
    }
    else
    {
        comparison = -1
    }

    return comparison;
}

run();
get_ratio();
final_arr = final_arr.sort(compare);
let data = JSON.stringify(final_arr, null, 4)

fs.writeFileSync("../ny_times_data/death_ratio.json", data);

console.log(final_arr)