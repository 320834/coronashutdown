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

console.log(format_date())
console.log("asddddd")