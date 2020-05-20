let fs = require("fs");
let csv = require("csvtojson")

let raw_cases = fs.readFileSync("../ny_times_data/nytimes_cases.json");
let raw_counties = fs.readFileSync("../data/county_map_2010.json");

let json_counties = JSON.parse(raw_counties);
let json_cases = JSON.parse(raw_cases);

//Global var
let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 3);

let county_dict = {}

let moving_average_dict = {};

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

//====================================================================
function append_property_dates(obj)
{
    let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

    let millitime;
    let dateObj;

    for (var i = 0; i < days; i++) {
        millitime = start_date.getTime() + 86400000 * i;
        dateObj = new Date(millitime);

        let key = format_date(dateObj)
    
        obj["properties"][key] = 0;
        obj["properties"][key + ".d"] = 0;
    }
  
    return obj;
}

/**
 * Construct county dictionary to append 
 */
function construct_county_dict()
{
    let obj_total = JSON.parse(raw_counties);

    let obj = obj_total["features"]

    let dict = {}

    for(let i = 0; i < obj.length; i++)
    {
        obj[i] = append_property_dates(obj[i]);

        let key = obj[i]["properties"]["STATE"]+obj[i]["properties"]["COUNTY"];

        dict[key] = obj[i];
    }

    return dict;
}

//====================================================================

/**
 * Merge cases to county map properties
 */
function merge_cases_death_to_county_map()
{
    let missing = {}
    for(let i = 0; i < json_cases.length; i++)
    {
        let key = json_cases[i]["fips"];

        
        if(county_dict[key] !== undefined)
        {
            let date_key = format_date(new Date(json_cases[i]["date"]));
            let date_key_death = date_key + ".d";

            county_dict[key]["properties"][date_key] += parseInt(json_cases[i]["cases"]);
            county_dict[key]["properties"][date_key_death] += parseInt(json_cases[i]["deaths"]);
        }
        else
        {
            fix_exceptions(json_cases[i]);
            // missing[json_cases[i]["state"]+"|"+json_cases[i]["county"]] = json_cases[i]["fips"];
        }

    }

    // console.log(missing)
    
}

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

            //Check cases
            if(value["properties"][displayDate] == 0)
            {
                value["properties"][displayDate] = value["properties"][yesDisplayDate]
                
            }

            //Check deaths
            if(value["properties"][displayDate + ".d"] == 0)
            {
                value["properties"][displayDate + ".d"] = value["properties"][yesDisplayDate + ".d"]
            }

        }
    }
}

/**
 * Fix exceptions for certain area codes. Cases are aggregated to city rather than county. Need to manually add it
 * @param {obj} case_obj 
 */
function fix_exceptions(case_obj)
{
    if(case_obj["state"]+"|"+case_obj["county"] == "New York|New York City")
    {
        let date_key = format_date(new Date(case_obj["date"]));
        let date_key_death = date_key + ".d";

        //Kings
        county_dict["36047"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["36047"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Queens
        county_dict["36081"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["36081"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //New York
        county_dict["36061"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["36061"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Richmond
        county_dict["36085"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["36085"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Bronx
        county_dict["36005"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["36005"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);
    }
    else if(case_obj["state"]+"|"+case_obj["county"] == "Missouri|Kansas City")
    {
        let date_key = format_date(new Date(case_obj["date"]));
        let date_key_death = date_key + ".d";

        //Jackson
        county_dict["29095"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["29095"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Clay
        county_dict["29047"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["29047"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Cass
        county_dict["29037"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["29037"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);

        //Cass
        county_dict["29165"]["properties"][date_key] += parseInt(case_obj["cases"]);
        county_dict["29165"]["properties"][date_key_death] += parseInt(case_obj["deaths"]);
    }
}

/**
 * Prep for 7 day moving average
 */
function hard_clone_obj()
{
    moving_average_dict = JSON.parse(JSON.stringify(county_dict));

    return;
}

//=========================================================================

function check_average_valid(curr, week_one_first, week_one_second, week_two_first, week_two_second, key)
{


    let obj = county_dict[key]["properties"];

    week_one_first = format_date(week_one_first)
    week_one_second = format_date(week_two_first)
    week_two_first = format_date(week_two_second)
    week_two_second = format_date(week_two_second)


    if(obj[curr] !== undefined && obj[week_one_first] !== undefined && obj[week_one_second] !== undefined && obj[week_two_first] !== undefined && obj[week_two_second] !== undefined)
    {
        return true;
    }

    return false;
}

/**
 * Calculates the seven day average given a start and end date
 * @param {string} key The county to calculate average from
 * @param {Date} start 
 * @param {Date} end 
 * @param {Number} flag Indicate if the cases or deaths, cases = 0, deaths = 1
 */
function calculate_seven_day_average(key, start, end, flag)
{
    let sum = 0;

    if(flag == 0)
    {
        let days = Math.floor((end - start) / 1000 / 60 / 60 / 24);

        //console.log(days)
        
        for(var i = 0; i < days; i++)
        {
            let millitime = start.getTime() + 86400000 * i;
            let curr_date = format_date(new Date(millitime));

            // console.log(county_dict[key]["properties"][curr_date])
            sum += county_dict[key]["properties"][curr_date];
        }

        // console.log();
        // console.log(days);
        // console.log(sum/days);

        return sum/days;
    }
    else
    {
        //For deaths

        let days = Math.floor((end - start) / 1000 / 60 / 60 / 24);

        console.log(days)
        
        for(var i = 0; i < days; i++)
        {
            let millitime = start.getTime() + 86400000 * i;
            let curr_date = format_date(new Date(millitime));

            // console.log(county_dict[key]["properties"][curr_date + ".d"])
            sum += county_dict[key]["properties"][curr_date + ".d"];
        }

        // console.log();
        // console.log(days);
        // console.log(sum/days);

        return sum/days;
    }
}

function loop_seven_day_average()
{
    let missing = {};

    for(let [key,value] of Object.entries(moving_average_dict))
    {
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for(let i = 0; i < days; i++)
        {
            let millitime = start_date.getTime() + 86400000 * i;
            let dateObj = new Date(millitime);
            
            let week_one_end = new Date(millitime);

            let week_one_start = new Date(millitime - 7 * 86400000);

            let week_two_end = new Date(millitime - 1 * 86400000);

            let week_two_start = new Date(millitime - 8 * 86400000);

            let current_death_date = format_date(dateObj) + ".d";
            let current_cases_date = format_date(dateObj);

            let key_value = value["properties"]["STATE"] + value["properties"]["COUNTY"];

            if(check_average_valid(current_death_date, week_one_end, week_one_start, week_two_end, week_two_start, key_value))
            {
                let one_week_cases = calculate_seven_day_average(key_value, week_one_start, week_one_end, 0);
                let two_week_cases = calculate_seven_day_average(key_value, week_two_start, week_two_end, 0);

                let one_week_deaths = calculate_seven_day_average(key_value, week_one_start, week_one_end, 1);
                let two_week_deaths = calculate_seven_day_average(key_value, week_two_start, week_two_end, 1);

                let seven_day_cases = (one_week_cases - two_week_cases)/(two_week_cases);
                let seven_day_deaths = (one_week_deaths - two_week_deaths)/(two_week_deaths);

                if(two_week_cases === 0)
                {
                    seven_day_cases = 0
                }

                if(two_week_deaths === 0)
                {
                    seven_day_deaths = 0;
                }

                seven_day_deaths = parseFloat(seven_day_deaths.toFixed(3));
                seven_day_cases = parseFloat(seven_day_cases.toFixed(3));

                value["properties"][current_death_date] = seven_day_deaths;
                value["properties"][current_cases_date] = seven_day_cases;
            }
        }
    }
}

//=====================================================================

function write_file_average_cases_deaths()
{
    let features = [];
  
    for (let [key, value] of Object.entries(moving_average_dict)) {
      features.push(value);
    }
  
    let jsonWrite = {
      type: "FeatureCollection",
      features: features
    };
  
    // let data = JSON.stringify(jsonWrite, null, 4);
    let data = JSON.stringify(jsonWrite);
  
    //fs.writeFileSync("../debug_data/counties-average.json", data);
    fs.writeFileSync("../final_data/counties-average.geojson", data);

    console.log("Finish writing average for deaths and cases")
}

function main()
{
    county_dict = construct_county_dict();

    merge_cases_death_to_county_map();

    fix_no_cases_date();

    hard_clone_obj();

    //console.log(moving_average_dict["10001"])

    loop_seven_day_average()

    write_file_average_cases_deaths()

    //calculate_seven_day_average("10001", new Date("04/30/2020"), new Date("05/07/2020"), 0)


}

main()