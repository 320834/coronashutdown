const {Builder, By, Key, until} = require('selenium-webdriver');
const webdriver = require('selenium-webdriver');
let fs = require("fs");

let link = "https://coronavirus.1point3acres.com/en";

let list_cases = [];

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

        list_cases.push(case_obj)

    }
}

(async function main(){
    let driver = new webdriver.Builder().forBrowser('firefox').build();
    await driver.get(link)
    // await scrape_page(driver);

    let index = 0;
    await driver.executeScript("window.scrollTo(0,4000)", "")

    while(await driver.findElement(By.className(" ant-pagination-next")).getAttribute("aria-disabled") === "false")
    {
        await scrape_page(driver);
        await driver.findElement(By.className(" ant-pagination-next")).click();
        write_file();
        console.log(index);
        index++;
    }
    
    

    // await driver.actions()
    
    driver.quit();
})();

