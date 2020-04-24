# coronashutdown

A repo for pulling county level coronavirus cases and deaths. Also aggregates the data to a geojson format for map on site.

Site: https://www.coronashutdown.com/

Data-sources:
1. NYTimes https://github.com/nytimes/covid-19-data
2. University Of Washington https://github.com/beoutbreakprepared/nCoV2019
3. 1point3arces https://coronavirus.1point3acres.com/en

# Getting Started

Source code for data pull is under *data_set_name*_src for each source

Ex. 

1. NYTimes - ./ny_times_src
2. University Of Washington - ./src
3. 1point3arces - ./selenium_src

## Prerequisites

**Only for 1point3arces data pull**
1. Go to this link https://github.com/mozilla/geckodriver/releases
2. Download the geckodriver for your operating system
3. Place the geckodriver on $PATH

## Install

npm i sync-request

npm i axios

npm i selenium-webdriver

npm i json2csv

npm i csv2json

npm i csvtojson


## Running 

Only using nytimes data for now, 
1. cd ny_times_src
2. node pull_data.js
3. node merge-ny-times.js
4. node create-state-csv.js
5. Data in ./final_data