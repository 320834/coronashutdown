const fs = require("fs");
const { Parser } = require('json2csv');

let rawCases = fs.readFileSync("../ny_times_data/ny-times.json");
let rawStateAbbreviation = fs.readFileSync("../misc_data/appreviations-states.json");

let jsonCases = JSON.parse(rawCases);
let jsonStateAbb = JSON.parse(rawStateAbbreviation);

let US_state_list = {};

let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 5);

function construct_dates(obj, container) {
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
        date = "0" + (dateObj.getDate());
      } else {
        date = dateObj.getDate();
      }
  
      if (month < 10) {
        month = "0" + month;
      }
  
      let key = date + "." + month + "." + year;
      let value = 0;
      date_dict[key] = value;
  
      obj[container][key] = 0;
    }
  
}

function create_state_list() {
    for (let [key, value] of Object.entries(jsonStateAbb)) {
      let obj = {
        current_confirmed: 0,
        current_deaths: 0,
        "confirmed": {},
        "death": {}
      };

    
      construct_dates(obj, "confirmed")
      construct_dates(obj, "death")

      US_state_list[value] = obj;
    }

    //create US
    let obj = {
        current_confirmed: 0,
        current_deaths: 0,
        "confirmed": {},
        "death": {}
    }

    construct_dates(obj, "confirmed")
    construct_dates(obj, "death")

    US_state_list["U.S Total"] = obj;
  }

function translate_date(date_input)
{
    let dateObj = new Date(date_input);
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

    

    return key;
}

function parse_cases_for_state()
{
    for(let i = 0; i < jsonCases.length; i++)
    {
        let obj = jsonCases[i];

        let key_date = translate_date(obj["date"]);
        let state = obj["state"];

        if(US_state_list[state] != undefined)
        {
            if(obj["cases"] === "Death")
            {
                US_state_list[state]["death"][key_date] += 1;
                US_state_list["U.S Total"]["death"][key_date] += 1;
            }
            else
            {   
                let cases = obj["cases"];
                US_state_list[state]["confirmed"][key_date] += cases;
                US_state_list["U.S Total"]["confirmed"][key_date] += cases;
            }
        }
        
    }
}

function fix_no_cases_date()
{
    for (let [key, value] of Object.entries(US_state_list)) {
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

            if(value["death"][displayDate] == 0)
            {
                value["death"][displayDate] = value["death"][yesDisplayDate]
            }

            if(value["confirmed"][displayDate] == 0)
            {
                value["confirmed"][displayDate] = value["confirmed"][yesDisplayDate]
            }

        }
    }
}

function write_file() {
    let data = JSON.stringify(US_state_list, null, 4);
  
    fs.writeFileSync("../final_data/state_confirmation_deaths.json", data);
}

function main()
{
    create_state_list()

    // console.log(US_state_list)
    parse_cases_for_state()

    fix_no_cases_date()

    // console.log(US_state_list["New York"])

    write_file()
}

main();