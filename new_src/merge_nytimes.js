let fs = require("fs");
let csv = require("csvtojson")

let raw_counties = fs.readFileSync("../data/county_map_2010.json");
let raw_cases = fs.readFileSync("../ny_times_data/nytimes_cases.json");
let raw_population = fs.readFileSync("../data/co-est2019-alldata.csv");
let raw_area = fs.readFileSync("../data/LND01.csv");

let json_counties = JSON.parse(raw_counties);
let json_cases = JSON.parse(raw_cases);

//Global var
let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 3);

let county_dict = {}

let cases_dict = {}
let sqm_dict = {}
let capita_dict = {}

//=======================================================================
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
//=======================================================================

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
    let obj = json_counties["features"];

    for(let i = 0; i < obj.length; i++)
    {
        obj[i] = append_property_dates(obj[i]);

        let key = obj[i]["properties"]["STATE"]+obj[i]["properties"]["COUNTY"];

        county_dict[key] = obj[i];
    }
}

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
 * Prep 3 geojson for cases, square mile, and per population
 */
function hard_clone_obj()
{
    cases_dict = { ...county_dict };
    capita_dict = { ...county_dict };
    sqm_dict = { ...county_dict };
}

//==========================================================================================================
//Cases Per Capita

function construct_population_county_list(pop_obj)
{
    population_county_dict = {}

    for(var i = 0; i < pop_obj.length; i++)
    {
        let obj = pop_obj[i];

        if(obj["STSTATE"] !== obj["CTYNAME"])
        {
            
            let key = obj["STATE"] + obj["COUNTY"];

            // console.log(county_name)
            population_county_dict[key] = obj
        }
    }

    return population_county_dict;
}

/**
 * Calculate cases per every 100,000 population in a given county
 * @param {String} county_state_key 
 * @param {Number} cases 
 * @param {Number} population 
 */
function get_ratio_per_hundred_thousand(county_state_key, cases, population)
{
    let population_hundred = population/100000;
    return cases/population_hundred;

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
    if(county_state_key === "36047" 
    || county_state_key === "36081" 
    || county_state_key === "36061"
    || county_state_key === "36085"
    || county_state_key === "36005")
    {
        // console.log(county_state_key)
        let population_per_thousand = 8623000/100000;
        return cases/population_per_thousand;
    }

    return ratio
}
/**
 * Loop through county list and divide the cases by the population
 */
function calculate_cases_per_capita(pop_county_dict)
{
    let missing = {}
    for(let [key,value] of Object.entries(capita_dict))
    {
        let days = Math.floor((end_date - start_date) / 1000 / 60 / 60 / 24);

        for(let i = 0; i < days; i++)
        {
            let millitime = start_date.getTime() + 86400000 * i;

            let dateObj = new Date(millitime);

            let cases_date = format_date(dateObj);
            let death_date = cases_date + ".d";

            let key = value["properties"]["STATE"] + value["properties"]["COUNTY"];

            if(pop_county_dict[key] != undefined)
            {
                let population = pop_county_dict[key]["POPESTIMATE2019"];
                let cases = value["properties"][cases_date];
                let death = value["properties"][death_date];

                let cases_per_capita = get_ratio_per_hundred_thousand(key, cases, population);
                cases_per_capita = handle_special_cases_population(key, cases, cases_per_capita);
            
                cases_per_capita = cases_per_capita.toFixed(2);
                cases_per_capita = parseFloat(cases_per_capita);

                value["properties"][cases_date] = cases_per_capita;
            }
            else
            {
                missing[key] = 0
            }
        }
    }

    // console.log(missing);
}

/**
 * Main function to get the county of cases per hundred thousand capita. First it fetches the data from csv
 */
async function cases_per_capita()
{
    // console.log(typeof rawPopulation.toString())
    return csv()
        .fromString(raw_population.toString())
        .then((pop_obj)=>{

            console.log("Read Population File")
            population_county_dict = construct_population_county_list(pop_obj)

            calculate_cases_per_capita(population_county_dict);

            // fs.writeFileSync("../debug_data/capita.json", JSON.stringify(capita_dict, null, 4))

            // write_file_cases_per_capita();
        })
}

//===========================================================================================================
/**
 * Main function to get county of cases per square mile.
 */
async function cases_per_county_sqm()
{
    // console.log(typeof rawPopulation.toString())
    return csv()
        .fromString(raw_area.toString())
        .then((jsonObj)=>{

            console.log("Read Population Per SQM")
            // construct_area_county_list(jsonObj);

            // calculate_cases_per_sqm();

            // write_file_cases_per_sqm()

        })
}

async function read_csv()
{
    return 0;
}

function main()
{
    construct_county_dict();

    merge_cases_death_to_county_map();

    fix_no_cases_date();

    hard_clone_obj()

    // fs.writeFileSync("../debug_data/dictionary.json", JSON.stringify(county_dict, null, 4))

    read_csv()
        .then(cases_per_capita)
        .then(cases_per_county_sqm)
        .then(function(){console.log("Finish Merging")})
}

main()