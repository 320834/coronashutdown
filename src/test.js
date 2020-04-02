// let fs = require("fs");
// var str = "New York City";

// let name = str.split(" City");

// console.log(name);

// let rawCases = fs.readFileSync("../data/cases.json");
// let jsonCases = JSON.parse(rawCases);

// let stuff = [];
// for (var i = 0; i < jsonCases.length; i++) {
//   if (jsonCases[i]["country"] === "United States") {
//     stuff.push(jsonCases[i]);
//   }
// }

// console.log(stuff.length);

// let f = 10.34

// f = f.toFixed(0)

// console.log(typeof f)

function format_date(date_obj)
{
    const ye = new Intl.DateTimeFormat('en', { year: 'numeric' }).format(date_obj)
    const mo = new Intl.DateTimeFormat('en', { month: '2-digit' }).format(date_obj)
    const da = new Intl.DateTimeFormat('en', { day: '2-digit' }).format(date_obj)

    //In format dd.mm.yyyy
    let date = da + "." + mo + "." + ye;

    return date;
}

let days = 95;
let start_date = new Date("01/01/2020");

for(let i = 0; i < days; i++)
{
    let millitime = start_date.getTime() + 86400000 * i;
    let date_obj = new Date(millitime);

    let key = format_date(date_obj);

    console.log(key)

}   