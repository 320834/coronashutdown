let csv = require("csvtojson")
const fs = require("fs");

let rawPopulation = fs.readFileSync("../data/co-est2019-alldata.csv");

async function f1()
{
    return csv()
    .fromString(rawPopulation.toString())
    .then((jsonObj)=>{

        console.log("Step Two")
    })
}

async function f()
{
    return csv()
    .fromString(rawPopulation.toString())
    .then((jsonObj)=>{

        console.log("Step one")
    })
}

f()
.then(f1)
.then(function(){
    console.log("stuff")
})

