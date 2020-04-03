const fs = require("fs");
let csv = require("csvtojson")

let rawCases = fs.readFileSync("../ny_times_data/ny-times.json");
let rawCounties = fs.readFileSync("../data/counties-new.json");
let rawStateAbbreviation = fs.readFileSync("../misc_data/appreviations-states.json");
let rawExceptions = fs.readFileSync("../misc_data/exceptions.json");
let rawPopulation = fs.readFileSync("../data/co-est2019-alldata.csv");
let rawArea = fs.readFileSync("../data/LND01.csv");

let jsonCases = JSON.parse(rawCases);
let jsonCounties = JSON.parse(rawCounties);
let jsonStateAbb = JSON.parse(rawStateAbbreviation);
let jsonExceptions = JSON.parse(rawExceptions);

let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 2);

let county_dict = {}

let debug_list = [];

let list_population_per_county_dict = {}
let list_area_per_county_dict = {}


//====================================================================================
//Misc Functions

/**
 * Takes a date object and format to standard
 * Standard Definition:
 * dd.mm.yyyy
 * @param {Date} date_obj 
 */
function format_date(date_obj)
{
    let date = "";
    let month = parseInt(date_obj.getMonth()) + 1;
    let year = date_obj.getFullYear();

    if (parseInt(date_obj.getDate()) < 10) {
        date = "0" + date_obj.getDate();
    } else {
        date = date_obj.getDate();
    }

    if (month < 10) {
        month = "0" + month;
    }

    //In format dd.mm.yyyy
    let key = date + "." + month + "." + year;

    return key;
}
//====================================================================================
//Part 1 methods

/**
 * Take county object from geojson format and append date properties
 * @param {Number} county_index 
 */
function construct_dates(county_index) {
    let date_dict = {};
  
  
    let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);
  
    let millitime;
    let dateObj;
    for (var i = 0; i < days; i++) {
      millitime = start_date.getTime() + 86400000 * i;
      dateObj = new Date(millitime);

      let key = format_date(dateObj)
      let value = 0;
      date_dict[key] = value;
  
      jsonCounties["features"][county_index]["properties"][key] = 0;
    }
  
    return date_dict;
}

/**
 * Construct a dictionary of counties. For each county entry, there exists a geojson object that includes
 * properties of the county and the geometry for the map.
 * 
 * Dictionary object => county_dict
 * key = county_name|state_name
 * value = The geojson for a specific object
 */
function construct_county_dict() {
    for (let i = 0; i < jsonCounties["features"].length; i++) {
        jsonCounties["features"][i]["properties"]["total_cases"] = 0;
        jsonCounties["features"][i]["properties"]["date_ind"] = construct_dates(i);

        let key =
        jsonCounties["features"][i]["properties"]["COUNTY"] +
        "|" +
        jsonCounties["features"][i]["properties"]["STATE"];

        let value = jsonCounties["features"][i];

        county_dict[key] = value;
    }
}

//=====================================================================================
//Part 2 methods

/**
 * Formats date and place it into the object of the cases
 * 
 * TODO: Figure out where this is called and use format_date() instead
 * @param {Object} obj 
 */
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

/**
 * Takes the object and remove the word County from the county property. The dictionary does not have use County
 * @param {Object} obj 
 */
function remove_county(obj)
{
    if(obj["county"].includes("County"))
    {
        obj["county"] = obj["county"].split(" ")[0];
    }
}

/**
 * Loop through cases and formats the cases. The cases are stored in jsonCases global variable
 */
function parse_cases()
{
    for(let i = 0; i < jsonCases.length; i++)
    {
        set_date(jsonCases[i]);
        remove_county(jsonCases[i]);
    }
}

//=============================================================================================
//Part 3

/**
 * Take a case object and check if it falls under the exceptions category
 * If the case are in specific areas, they are exceptions and have to be handled
 * 
 * Ex.
 * Kansas City should map to Jackson, Clay, Platte, and Cass
 * @param {Object} obj 
 */
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

/**
 * Take case object and append cases to a specific county
 * @param {Object} caseObj 
 * @param {Object} countyObj 
 */
function append_cases_to_county_dates(caseObj, countyObj)
{
    let date_confirmation = caseObj["date"];

    countyObj["properties"]["total_cases"] += caseObj['cases'];
    countyObj["properties"][date_confirmation] += caseObj['cases'];
    countyObj["properties"]["date_ind"][date_confirmation] += caseObj['cases'];

}

/**
 * Cases from NYTimes data and append data to geojson format for map. Geojson will be exported to site
 */
function merge_cases_county()
{
    for(let i = 0; i < jsonCases.length; i++)
    {
        let obj = jsonCases[i];

        if(obj["county"] === "" || obj["cases"] === "Death" || obj["state"] === undefined || obj["county"] === "Unassigned" || obj["county"] === "Unknown")
        {
            //Do nothing these cases do not matter.
            //Either the cases does not have state or state or is a death
        }
        else
        {
            let county_state_key = obj["county"] + "|" + obj["state"];

            //True if key can be found in dictionary, then add cases to that specific county and date
            //False if key cannot be found in dictionary and the case is New York City
            //New York City is different as it encompasses 5 different counties. 
            if(county_dict[county_state_key] !== undefined && county_state_key !== "New York City|New York")
            {
                //Append cases for dates
                append_cases_to_county_dates(obj, county_dict[county_state_key])
            }
            else
            {
                //If key cannot be found, then look through exceptions list. 
                //These exceptions are for cities where the cases reported are designated to cities but not specific counties
                let list = handle_exceptions(obj);

                //Loop through exception list as some cities occupy multiply counties
                for(let i = 0; i < list.length; i++)
                {
                    county_state_key = list[i] + "|" + obj["state"];

                    if(county_dict[county_state_key] !== undefined)
                    {
                        append_cases_to_county_dates(obj, county_dict[county_state_key])
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

//==================================================================================================
//Part 4 and 5

/**
 * Does error checking on any dates that don't have cases. Takes previous date case if 0 are found
 */
function fix_no_cases_date()
{
    for (let [key, value] of Object.entries(county_dict)) {
        // let cumulative_count = 0;
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for (let i = 1; i < days; i++) {
            let millitime = start_date.getTime() + 86400000 * i;

            let dateObj = new Date(millitime);
            let yestObj = new Date(start_date.getTime() + 86400000 * (i-1))

            let displayDate = format_date(dateObj)
            let yesDisplayDate = format_date(yestObj)

            if(value["properties"][displayDate] == 0)
            {
                value["properties"][displayDate] = value["properties"][yesDisplayDate]
                value["properties"]["date_ind"][displayDate] = value["properties"]["date_ind"][yesDisplayDate]
            }

        }
    }
}

/**
 * Write cumulative cases to counties-cases.geojson
 */
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
  
    // fs.writeFileSync("../debug_data/counties-cases.json", data);
    fs.writeFileSync("../final_data/counties-cases.geojson", data);
}

//===================================================================================================
//Part 6

/**
 * Takes a json object and create a dictionary for county population
 * 
 * Stores results in list_population_per_county_dict
 * 
 * @param {JSON} jsonObj 
 */
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
            list_population_per_county_dict[key] = obj
        }
    }
}

/**
 * Calculate cases per every 10,000 population in a given county
 * @param {String} county_state_key 
 * @param {Number} cases 
 * @param {Number} population 
 */
function get_ratio_per_ten_thousand(county_state_key, cases, population)
{
    let population_per_thousand = population/10000;
    return cases/population_per_thousand;

}

/**
 * Handles exceptions for specific cities
 * 
 * The ratio for NYC will be the same for counties, Richmond, Kings, Queens, New York, and Bronx
 * The reason is due to the fact those 5 counties are constructed with the same cases
 * 
 * @param {String} county_state_key 
 * @param {Number} cases 
 * @param {Number} ratio 
 */
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

/**
 * Loop through each county and each date and calculate the cases per ten thousand capita.
 */
function calulate_cases_per_capita()
{
    // let index = 0;
    let visited = {}

    for (let [key, value] of Object.entries(county_dict)) {
        // let cumulative_count = 0;
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for (let i = 0; i < days; i++) {
            let millitime = start_date.getTime() + 86400000 * i;

            let dateObj = new Date(millitime);

            let displayDate = format_date(dateObj);

            let county_state_key = value["properties"]["COUNTY"] + "|" + value["properties"]["STATE"];

            if(list_population_per_county_dict[county_state_key] != undefined)
            {
                let population = list_population_per_county_dict[county_state_key]["POPESTIMATE2019"];
                let cases = value["properties"]["date_ind"][displayDate];

                let cases_per_ten_thousand = get_ratio_per_ten_thousand(county_state_key,cases, population)
                cases_per_ten_thousand = handle_special_cases_population(county_state_key, cases, cases_per_ten_thousand);

                cases_per_ten_thousand = cases_per_ten_thousand.toFixed(2);
                cases_per_ten_thousand = parseFloat(cases_per_ten_thousand);

                value["properties"][displayDate] = cases_per_ten_thousand;
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

/**
 * Main function to get the county of cases per ten thousand capita. First it fetches the data from csv
 */
async function cases_per_capita()
{
    // console.log(typeof rawPopulation.toString())
    return csv()
        .fromString(rawPopulation.toString())
        .then((jsonObj)=>{

            construct_population_county_list(jsonObj)

            calulate_cases_per_capita();

            write_file_cases_per_capita();
        })
}

/**
 * Write the county of cases per ten thousand capita to file
 */
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

    console.log("Finish writing county per capita file")
}

//================================================================================================
//Part 7

/**
 * Construct dictionary of counties and their respective area size
 * @param {JSON} jsonObj 
 */
function construct_area_county_list(jsonObj)
{
    for(let i = 0; i < jsonObj.length; i++)
    {
        let obj = jsonObj[i];
        if(obj["Areaname"].includes(","))
        {
            let comp = obj["Areaname"].split(", ");
            let state = jsonStateAbb[comp[1]];
            let key = comp[0] + "|" + state;

            list_area_per_county_dict[key] = obj;
        }
        else
        {
            //Not a county
        }
        
    }
}

function handle_special_cases_area(county_state_key, cases, ratio)
{
    if(county_state_key === "Kings|New York" 
    || county_state_key === "Queens|New York" 
    || county_state_key === "Richmond|New York"
    || county_state_key === "Bronx|New York"
    || county_state_key === "New York|New York")
    {
        // console.log(county_state_key
        return cases/303;
    }
    

    return ratio
}

/**
 * Calculate each date per sq mile
 */
function calculate_cases_per_sqm()
{
    for(let [key, value] of Object.entries(county_dict))
    {
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for (let i = 0; i < days; i++) {
            let millitime = start_date.getTime() + 86400000 * i;

            let dateObj = new Date(millitime);

            let displayDate = format_date(dateObj);

            let county_state_key = value["properties"]["COUNTY"] + "|" + value["properties"]["STATE"];
            
            if(list_area_per_county_dict[county_state_key] != undefined)
            {
                let area = list_area_per_county_dict[county_state_key]["LND010190D"];
                let cases = value["properties"]["date_ind"][displayDate];

                let cases_per_sqm = (cases/area);
                cases_per_sqm = handle_special_cases_area(county_state_key, cases, cases_per_sqm);

                cases_per_sqm = parseFloat(cases_per_sqm.toFixed(4));

                
                value["properties"][displayDate] = cases_per_sqm;
            }
            else
            {

                if(county_state_key === "District of Columbia|District of Columbia")
                {
                    let cases = value["properties"]["date_ind"][displayDate];

                    let cases_per_sqm = parseInt((cases/(68.34)).toFixed(4));

                    value["properties"][displayDate] = cases_per_sqm;
                }
                else
                {
                    value["properties"][displayDate] = 0
                }
                
                
            }

        }
    }
}

function write_file_cases_per_sqm()
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
  
    fs.writeFileSync("../debug_data/counties-per-sqm-cases.json", data);
    fs.writeFileSync("../final_data/counties-per-sqm-cases.geojson", data);

    console.log("Finish writing county per sq mile file")
}

async function cases_per_county_sqm()
{
    // console.log(typeof rawPopulation.toString())
    return csv()
        .fromString(rawArea.toString())
        .then((jsonObj)=>{

            construct_area_county_list(jsonObj);

            calculate_cases_per_sqm();

            write_file_cases_per_sqm()

        })
}


//================================================================================================

function main()
{
    //Part 1, construct dictionary dict to make it easier to find specific counties
    construct_county_dict();

    //Part 2, parse through cases from NY Times cases and format them.
    parse_cases();

    //Part 3, take the cases from NY Times and merge it to county geojson data. **IMPORTANT STEP**
    merge_cases_county();

    //Part 4, error fix future dates
    fix_no_cases_date()

    //Part 5, write to file
    write_file_cases();

    //Part 6, calculate cases per ten thousand capita.
    cases_per_capita()
        //Part 7, calculate cases per square mile
        .then(cases_per_county_sqm)
        .then(function(){
            console.log("Finish merging")
        })

}

main();