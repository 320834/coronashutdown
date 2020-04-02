const fs = require("fs");
let csv = require("csvtojson")

let rawCases = fs.readFileSync("../ny_times_data/ny-times.json");
let rawCounties = fs.readFileSync("../data/counties-new.json");
let rawStateAbbreviation = fs.readFileSync("../misc_data/appreviations-states.json");
let rawExceptions = fs.readFileSync("../misc_data/exceptions.json");
let rawPopulation = fs.readFileSync("../data/co-est2019-alldata.csv");

let jsonCases = JSON.parse(rawCases);
let jsonCounties = JSON.parse(rawCounties);
let jsonStateAbb = JSON.parse(rawStateAbbreviation);
let jsonExceptions = JSON.parse(rawExceptions);

let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 2);

let county_dict = {}

let debug_list = [];

let list_population_per_county = {}

function construct_dates(county_index) {
    let date_dict = {};
  
  
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

function set_date(obj)
{
    let dateObj = new Date(obj["date"]);
    dateObj = new Date(dateObj.getTime()+86400000)

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

    obj["date"] = key;
}

function remove_county(obj)
{
    if(obj["county"].includes("County"))
    {
        obj["county"] = obj["county"].split(" ")[0];
    }
}

function parse_cases()
{
    for(let i = 0; i < jsonCases.length; i++)
    {
        // get_number_cases(jsonCases[i]);
        // stateAbb_to_state(jsonCases[i]);
        set_date(jsonCases[i]);
        remove_county(jsonCases[i]);
        // console.log(jsonCases[i]["cases"] + " " + jsonCases[i]["state"] + " " + jsonCases[i]["date"]);
    }
}

function handle_exceptions(obj)
{
    if(obj["state"] === "District of Columbia")
    {
        return ["District of Columbia"];
    }
    else
    {
        if(jsonExceptions[obj["county"]] !== undefined)
        {
            return jsonExceptions[obj["county"]];
        }
        else
        {
            return []
            // console.log("Error cannot find county for " + obj["county"] + " " + obj["state"])
        }
    }
}

function append_cases_to_county_dates(caseObj, countyObj)
{
    let date_confirmation = caseObj["date"];

    countyObj["properties"]["total_cases"] += caseObj['cases'];
    countyObj["properties"][date_confirmation] += caseObj['cases'];
    countyObj["properties"]["date_ind"][date_confirmation] += caseObj['cases'];

}

function merge_cases_county()
{
    for(let i = 0; i < jsonCases.length; i++)
    {
        let obj = jsonCases[i];

        if(obj["county"] === "" || obj["cases"] === "Death" || obj["state"] === undefined || obj["county"] === "Unassigned" || obj["county"] === "Unknown")
        {
            //Do nothing these cases do not matter
        }
        else
        {
            let county_state = obj["county"] + "|" + obj["state"];

            if(county_dict[county_state] !== undefined && county_state !== "New York City|New York")
            {
                //Append cases for dates
                append_cases_to_county_dates(obj, county_dict[county_state])
            }
            else
            {
                let list = handle_exceptions(obj);

                for(let i = 0; i < list.length; i++)
                {
                    county_state = list[i] + "|" + obj["state"];

                    if(county_dict[county_state] !== undefined)
                    {
                        append_cases_to_county_dates(obj, county_dict[county_state])
                    }
                    else
                    {
                        console.log("Cannot find " + obj["county"] + " " + obj["state"]);
                    }
                }

            }
        }

    }
}

function write_file_cases() {
    let features = [];
  
    for (let [key, value] of Object.entries(county_dict)) {
      features.push(value);
    }
  
    let jsonWrite = {
      type: "FeatureCollection",
      features: features
    };
  
    let data = JSON.stringify(jsonWrite);
  
    fs.writeFileSync("../debug_data/counties-cases.json", data);
    fs.writeFileSync("../final_data/counties-cases.geojson", data);
}

function fix_no_cases_date()
{
    for (let [key, value] of Object.entries(county_dict)) {
        // let cumulative_count = 0;
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for (let i = 1; i < days; i++) {
            let millitime = start_date.getTime() + 86400000 * i;

            let dateObj = new Date(millitime);
            let yestObj = new Date(start_date.getTime() + 86400000 * (i-1))

            let date = "";
            let month = parseInt(dateObj.getMonth()) + 1;
            let year = dateObj.getFullYear();

            let yesDate = "";
            let yesMonth = parseInt(yestObj.getMonth()) + 1;
            let yesYear = yestObj.getFullYear();

            if (parseInt(dateObj.getDate()) < 10) {
                date = "0" + dateObj.getDate();
            } else {
                date = dateObj.getDate();
            }

            if (parseInt(yestObj.getDate()) < 10) {
                yesDate = "0" + yestObj.getDate();
            } else {
                yesDate = yestObj.getDate();
            }


            if (month < 10) {
                month= "0" + month;
            }

            if (yesMonth < 10) {
                yesMonth = "0" + yesMonth;
            }

            let displayDate = date + "." + month + "." + year;
            let yesDisplayDate = yesDate + "." + yesMonth + "." + yesYear;

            if(value["properties"][displayDate] == 0)
            {
                value["properties"][displayDate] = value["properties"][yesDisplayDate]
            }

        }
    }
}

//=============================================================================================
function construct_population_county_list(jsonObj)
{
    // console.log(jsonObj[1])
            
    for(var i = 0; i < jsonObj.length; i++)
    {
        let obj = jsonObj[i];

        if(obj["STATE"] !== obj["CTYNAME"])
        {
            let county_name = obj["CTYNAME"];
            let key = ""

            if(county_name.includes("city"))
            {
                key = county_name.split(" city")[0] + "|" + obj["STNAME"];
            }
            else if(county_name.includes("County"))
            {
                key = county_name.split(" County")[0] + "|" + obj["STNAME"];
            }
            else
            {
                key = county_name.split(" Parish")[0] + "|" + obj["STNAME"];
            }

            // console.log(county_name)
            list_population_per_county[key] = obj
        }
    }
}


function get_ratio_per_ten_thousand(county_state_key, cases, population)
{
    let population_per_thousand = population/10000;
    return cases/population_per_thousand;

}

function handle_special_cases_population(county_state_key, cases, ratio)
{
    if(county_state_key === "Kings|New York" 
    || county_state_key === "Queens|New York" 
    || county_state_key === "Richmond|New York"
    || county_state_key === "Bronx|New York"
    || county_state_key === "New York|New York")
    {
        // console.log(county_state_key)
        let population_per_thousand = 8623000/10000;
        return cases/population_per_thousand;
    }

    return ratio
}

function calulate_cases_per_capita()
{
    // let index = 0;
    let visited = {}

    for (let [key, value] of Object.entries(county_dict)) {
        // let cumulative_count = 0;
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        // if(index === 2)
        // {
        //     console.log(value);
        // }

        // index++;

        for (let i = 0; i < days; i++) {
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
                month= "0" + month;
            }


            let displayDate = date + "." + month + "." + year;

            let county_state_key = value["properties"]["COUNTY"] + "|" + value["properties"]["STATE"];

            if(list_population_per_county[county_state_key] != undefined)
            {
                let population = list_population_per_county[county_state_key]["POPESTIMATE2019"];
                let cases = value["properties"][displayDate];

                let cases_per_thousand = get_ratio_per_ten_thousand(county_state_key,cases, population)
                cases_per_thousand = handle_special_cases_population(county_state_key, cases, cases_per_thousand);

                cases_per_thousand = cases_per_thousand.toFixed(0);
                cases_per_thousand = parseInt(cases_per_thousand);

                value["properties"][displayDate] = cases_per_thousand;
            }
            else
            {
                // if(!county_state_key.includes("Puerto Rico"))
                // {
                //     if(visited[county_state_key] === undefined)
                //     {
                //         visited[county_state_key] = true;
                //     }
                
                // }
                
            }
            
            

        }
    }

    // console.log(visited)
}

function cases_per_capita()
{
    // console.log(typeof rawPopulation.toString())
    csv()
        .fromString(rawPopulation.toString())
        .then((jsonObj)=>{

            construct_population_county_list(jsonObj)

            calulate_cases_per_capita();

            // console.log(county_dict["New York|New York"]["properties"]["25.03.2020"])
            // console.log(county_dict["Queens|New York"]["properties"]["25.03.2020"])
            // console.log(county_dict["Richmond|New York"]["properties"]["25.03.2020"])
            // console.log(county_dict["Kings|New York"]["properties"]["25.03.2020"])
            // console.log(county_dict["Bronx|New York"]["properties"]["25.03.2020"])

            write_file_cases_per_capita();
        })
}

function write_file_cases_per_capita()
{
    let features = [];
  
    for (let [key, value] of Object.entries(county_dict)) {
      features.push(value);
    }
  
    let jsonWrite = {
      type: "FeatureCollection",
      features: features
    };
  
    let data = JSON.stringify(jsonWrite);
  
    fs.writeFileSync("../debug_data/counties-per-capita-cases.json", data);
    fs.writeFileSync("../final_data/counties-per-capita-cases.geojson", data);
}

function main()
{
    construct_county_dict();

    parse_cases();

    merge_cases_county();

    fix_no_cases_date()

    write_file_cases();

    cases_per_capita();

}

main();