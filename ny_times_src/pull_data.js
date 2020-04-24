let request = require("sync-request");
let csv = require("csvtojson")
let fs = require("fs")

//Global Variables
let list_cases = null;
let write_cases = []

function format_confirmation(ny_times_obj)
{
    let obj = {
        "cases": parseInt(ny_times_obj["cases"]),
        "date": ny_times_obj["date"],
        "state": ny_times_obj["state"],
        "county": ny_times_obj["county"],
        "notes": "",
        "source": "https://github.com/nytimes/covid-19-data"
    }

    write_cases.push(obj);
}

function format_death(ny_times_obj)
{
    let number_death = parseInt(ny_times_obj["deaths"])

    for(let i = 0; i < number_death; i++)
    {
        let obj = {
            "cases": "Death",
            "date": ny_times_obj["date"],
            "state": ny_times_obj["state"],
            "county": ny_times_obj["county"],
            "notes": "",
            "source": "https://github.com/nytimes/covid-19-data"
        }

        write_cases.push(obj)
    }


}

function format_cases()
{
    // console.log(list_cases[0])

    for(let i = 0; i < list_cases.length; i++)
    {
        if(list_cases[i]["cases"] != undefined)
        {
            if(parseInt(list_cases[i]["cases"]) > 0)
            {
                format_confirmation(list_cases[i])
            }

            if(parseInt(list_cases[i]["deaths"]) > 0)
            {
                format_death(list_cases[i])
            }
        }
        else
        {
            console.log(list_cases[i]["cases"])
        }
        // console.log(typeof list_cases[i]["cases"])
    }
}

async function parse_csv_to_json(csv_str)
{
    csv()
        .fromString(csv_str)
        .then((jsonObj)=>{
            list_cases = jsonObj
            // console.log("Finish pulling")

            format_cases()
            write_file_cases()
        })
}

async function api_call()
{
    let res = request("GET", 'https://raw.githubusercontent.com/nytimes/covid-19-data/master/us-counties.csv');

    parse_csv_to_json(res.getBody("utf-8"))

}

function format_date()
{
    dateObj = new Date();
  
    let date = "";
    let month = parseInt(dateObj.getMonth()) + 1;
    let year = dateObj.getFullYear();

    let hour = dateObj.getHours();
    let minute = dateObj.getMinutes();

    if (parseInt(dateObj.getDate()) < 10) {
    date = "0" + dateObj.getDate();
    } else {
    date = dateObj.getDate();
    }

    if (month < 10) {
    month = "0" + month;
    }
    let key = month + "-" + date + "-" + year + "-" + hour + ":" + minute

    return key;
}

function write_file_cases()
{
    let data = JSON.stringify(write_cases, null, 4);

    fs.writeFileSync("../ny_times_data/ny-times.json", data);
    //Write to archive data
    // fs.writeFileSync("../archive_data/ny-times.json-" + format_date() + ".json", data);
}

function main()
{
    api_call()
}

main()