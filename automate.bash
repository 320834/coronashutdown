#!/bin/bash
# A script to automate data collection and data dump for coronashutdown
# /home/panda/Desktop/Repository/coronashutdown

PATH=$PATH:/home/panda/bin

cd /home/panda/Desktop/Repository/coronashutdown/selenium_src
node update_pull.js
node merge-sel.js
node create-state-csv.js

cd ..

git add .
git commit -m "new data"
git push

#Move files to update map
cd 
cp ~/Desktop/Repository/coronashutdown/final_data/counties-cases.geojson ~/Desktop/Repository/Geojson_data
cp ~/Desktop/Repository/coronashutdown/final_data/state_confirmation_deaths.csv ~/Desktop/Repository/Geojson_data

cd /home/panda/Desktop/Repository/Geojson_data

#Push to geojson_Data repo
git add .
git commit -m "new data"
git push

echo "Finish pulling data"