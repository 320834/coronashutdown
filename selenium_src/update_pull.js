const {Builder, By, Key, until} = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
let fs = require("fs");

let rawCases = fs.readFileSync("../selenium_data/us-cases-1point3acres.json");
let json_visited_cases = JSON.parse(rawCases);

let link = "https://coronavirus.1point3acres.com/en";

let dict_visited_cases = {};

let visited_count = 0;

let time_start;

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

    if(minute < 10)
    {
        minute = "0" + minute;
    }

    let key = month + "-" + date + "-" + year + "-" + hour + ":" + minute

    return key;
}

function get_number_cases(obj)
{
    let cases = obj["cases"];

    if(typeof(cases) != "number" && cases !== "Death")
    {
        cases = cases.split(".")[1];
        if(cases.includes("-"))
        {
            let top = cases.split("-")[1];
            let bottom = cases.split("-")[0];

            obj["cases"] = parseInt(top) - parseInt(bottom) + 1;
        }
        else
        {
            obj["cases"] = 1;
        }
    }
}

function construct_dict_visited_cases()
{
    for(let i = 0; i < json_visited_cases.length; i++)
    {
        let obj = json_visited_cases[i];
        get_number_cases(obj);
        let key = obj["date"] + obj["state"] + obj["county"];

        dict_visited_cases[key] = true;
    }
} 

async function write_file()
{
    let data = JSON.stringify(list_cases, null, 4);

    fs.writeFileSync("../selenium_data/us-cases-1point3acres.json", data);

    //Write to archive data
    fs.writeFileSync("../archive_data/us-cases-1point3acres-" + format_date() + ".json", data);
}

async function scrape_page(driver)
{
    // let colObj = await driver.findElements(By.xpath("/html/body/div[1]/div/div[5]/div[2]/div[1]/div[5]/div/div/div/div[2]/div[1]/table/tbody/tr"));
    let rowObj = await driver.findElements(By.xpath("/html/body/div[1]/div/div[5]/div[2]/div[1]/div[5]/div/div/div/div[2]/div[1]/table/tbody/tr"))

    await rowObj[0].findElements(By.tagName("td"));
    
    for(let i = 0; i < rowObj.length; i++)
    {
        let row = await rowObj[i].findElements(By.tagName("td"))

        let case_obj = {
            "cases": "",
            "date": "",
            "state": "",
            "county": "",
            "notes": "",
            "source": ""
        }

        for(var j = 0; j < row.length; j++)
        {
            // console.log(await row[j].getText());
            
            if(j == 0)
            {
                case_obj["cases"] = await row[j].getText();
            }
            else if(j == 1)
            {
                case_obj["date"] = await row[j].getText();
            }
            else if(j == 2)
            {
                case_obj["state"] = await row[j].getText();
            }
            else if(j == 3)
            {
                case_obj["county"] = await row[j].getText();
            }
            else if(j == 4)
            {
                case_obj["notes"] = await row[j].getText();
            }
            else if(j == 5)
            {
                case_obj["source"] = await row[j].getText();
            }
        }

        let key = case_obj["date"] + case_obj["state"] + case_obj["county"];
        if(dict_visited_cases[key] !== undefined)
        {
            //Already in list, no need to add to list_cases
            visited_count += 1;
            console.log("Visited " + visited_count)
        }
        else
        {
            visited_count = 0;
            get_number_cases(case_obj)
            list_cases.push(case_obj)
            console.log("Add new " + case_obj["cases"] + " " + case_obj["date"] + " " + case_obj["state"] + " " + case_obj["county"]);
        }

        
        

    }
}


(async function main(){

    list_cases = json_visited_cases;
    construct_dict_visited_cases();

    time_start = new Date()

    let driver = new webdriver.Builder().forBrowser('firefox').build();
    await driver.get(link)

    let index = 0;
    // await driver.executeScript("window.scrollTo(0,4000)", "")
    await driver.executeScript("document.getElementsByClassName('ant-table-footer')[0].scrollIntoView()", "")

    let loop_status = await driver.findElement(By.className(" ant-pagination-next")).getAttribute("aria-disabled") === "false"
    await scrape_page(driver);

    while(loop_status)
    {
        await driver.findElement(By.className(" ant-pagination-next")).click();
        await scrape_page(driver);

        await driver.executeScript("document.getElementsByClassName('ant-table-footer')[0].scrollIntoView()", "")

        write_file();
        console.log("Page " + index);
        index++;

        loop_status = await driver.findElement(By.className(" ant-pagination-next")).getAttribute("aria-disabled") === "false"

        if(visited_count > 30)
        {
            break;
        }
    }
    
    console.log("Finish Pulling. Time End" + new Date())
    console.log("Time elapsed: " + (new Date().getTime() - time_start.getTime()) + " millseconds");
    driver.quit();
})();