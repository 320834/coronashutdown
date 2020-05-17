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

let start_date = new Date("1/1/2020");
let millitime = start_date.getTime() + 86400000 * 50;
let dateObj = format_date(new Date(millitime)) + ".d";
let week_one_second = format_date(new Date(millitime - 86400000)) + ".d";
let week_one_first = format_date(new Date(millitime - 7 * 86400000)) + ".d";

let week_two_second = format_date(new Date(millitime - 8 * 86400000)) + ".d";
let week_two_first = format_date(new Date(millitime - 14 * 86400000)) + ".d";


console.log(dateObj)

console.log(week_one_second)
console.log(week_one_first)

console.log(week_two_second)
console.log(week_two_first)

console.log(0/0)