const {Builder, By, Key, until} = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
let fs = require("fs");

let rawCases = fs.readFileSync("../selenium_data/us-cases-1point3acres.json");
let json_visited_cases = JSON.parse(rawCases);

let link = "https://coronavirus.1point3acres.com/en";

let list_cases = [];

let dict_visited_cases = {};

let visited_count = 0;

let time_start = new Date();

function construct_dict_visited_cases()
{
    for(let i = 0; i < json_visited_cases.length; i++)
    {
        let obj = json_visited_cases[i];
        let key = obj["cases"] + obj["date"] + obj["state"] + obj["county"];

        dict_visited_cases[key] = true;
    }
} 

async function write_file()
{
    let data = JSON.stringify(list_cases, null, 4);

    fs.writeFileSync("../selenium_data/us-cases-1point3acres.json", data);
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

        // let key = case_obj["cases"] + case_obj["date"] + case_obj["state"] + case_obj["county"];
        // if(dict_visited_cases[key] !== undefined)
        // {
        //     //Already in list, no need to add to list_cases
        //     visited_count += 1;
        //     console.log("Visited " + visited_count)
        // }
        // else
        // {
            
        // }

        list_cases.push(case_obj)
        console.log("Add new " + case_obj["cases"]);
        

    }
}

(async function main(){

    // list_cases = json_visited_cases;
    // construct_dict_visited_cases();



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

        // if(visited_count >= 15)
        // {
        //     driver.quit();
        // }

        loop_status = await driver.findElement(By.className(" ant-pagination-next")).getAttribute("aria-disabled") === "false"
    }
    
    console.log("Finish Pulling. Time End" + new Date())
    console.log("Time elapsed: " + (new Date().getTime() - time_start.getTime()) + " millseconds");
    driver.quit();
})();

