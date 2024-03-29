const fs = require("fs")


let raw_cases = fs.readFileSync("../ny_times_data/nytimes_cases.json");
let raw_state = fs.readFileSync("../data/state-list.json");

let json_cases = JSON.parse(raw_cases);
let json_state = JSON.parse(raw_state);

let start_date = new Date("1/1/2020");
let end_date = new Date(new Date().getTime() + 86400000 * 5);

let state_list = {};

//=========================================================================
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

function construct_state_list()
{
    for(let i = 0; i < json_state.length; i++)
    {
        let name = json_state[i]["name"];

        let state_obj = {
            "current_confirmed" : 0,
            "current_deaths": 0,
            "confirmed": {},
            "death": {}
        }

        construct_dates(state_obj, "confirmed");
        construct_dates(state_obj, "death");

        state_list[name] = state_obj;
    }

    //Construct For U.S Total
    let state_obj = {
        "current_confirmed" : 0,
        "current_deaths": 0,
        "confirmed": {},
        "death": {}
    }

    construct_dates(state_obj, "confirmed");
    construct_dates(state_obj, "death");

    state_list["U.S Total"] = state_obj;


}

function parse_cases_for_state()
{
    for(let i = 0; i < json_cases.length; i++)
    {
        let obj = json_cases[i];

        

        let key_date = format_date(new Date(obj["date"]));
        let state = obj["state"];

        //Exceptions
        if(state === "District of Columbia")
        {
            state = "District Of Columbia"
        }

        let deathCount = 0;
        let caseCount = 0;

        

        try {
            deathCount = parseInt(obj["deaths"]) ? parseInt(obj["deaths"]) : 0;
            caseCount = parseInt(obj["cases"]) ? parseInt(obj["cases"]) : 0;
        }
        catch(e)
        {
            console.log("Error Here")
        }

        if(state_list[state] != undefined)
        {
            // state_list[state]["death"][key_date] += parseInt(obj["deaths"]);
            // state_list[state]["confirmed"][key_date] += parseInt(obj["cases"]);

            // state_list["U.S Total"]["death"][key_date] += parseInt(obj["deaths"]);
            // state_list["U.S Total"]["confirmed"][key_date] += parseInt(obj["cases"]);

            state_list[state]["death"][key_date] += deathCount;
            state_list[state]["confirmed"][key_date] += caseCount;

            state_list["U.S Total"]["death"][key_date] += deathCount;
            state_list["U.S Total"]["confirmed"][key_date] += caseCount;
        }
        else
        {
            console.log(state);
        }
    }
}

function fix_no_cases_date()
{
    for (let [key, value] of Object.entries(state_list)) {
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
    let data = JSON.stringify(state_list, null, 4);
  
    fs.writeFileSync("../final_data/state_confirmation_deaths.json", data);
}

function main()
{
    construct_state_list();

    parse_cases_for_state();

    fix_no_cases_date();

    write_file()
}

main()