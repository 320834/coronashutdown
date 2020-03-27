const fs = require("fs");

let rawCases = fs.readFileSync("../ny_times_data/ny-times.json");
let rawCounties = fs.readFileSync("../data/counties-new.json");
let rawStateAbbreviation = fs.readFileSync("../misc_data/appreviations-states.json");
let rawExceptions = fs.readFileSync("../misc_data/exceptions.json");

let jsonCases = JSON.parse(rawCases);
let jsonCounties = JSON.parse(rawCounties);
let jsonStateAbb = JSON.parse(rawStateAbbreviation);
let jsonExceptions = JSON.parse(rawExceptions);

let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 2);

let county_dict = {}

let debug_list = [];

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

    obj["date_obj"] = dateObj;

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
  
    fs.writeFileSync("../debug_data/counties-cases.json", data);
    fs.writeFileSync("../final_data/counties-cases.geojson", data);

  }

function construct_cumulative() {
for (let [key, value] of Object.entries(county_dict)) {
    let cumulative_count = 0;
    let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

    for (let i = 0; i < days; i++) {
    let millitime = start_date.getTime() + 86400000 * i;
    // let millitimeYes = start_date.getTime() + 86400000 * (i - 1);

    let dateObj = new Date(millitime);
    // let dateObjYes = new Date(millitimeYes);

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

    let displayDate = date + "." + month + "." + year;
    // let displayDateYes = dateYes + "." + monthYes + "." + yearYes;

    cumulative_count += value["properties"][displayDate];
    value["properties"][displayDate] = cumulative_count;
    }
}
}

function main()
{
    construct_county_dict();

    parse_cases();

    merge_cases_county();

    construct_cumulative();

    write_file();
}

main();