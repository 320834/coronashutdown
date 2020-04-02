#!/bin/bash
# A script to automate data collection and data dump for coronashutdown
# /home/panda/Desktop/Repository/coronashutdown

PATH=$PATH:/home/panda/bin

cd /home/panda/Desktop/Repository/coronashutdown/ny_times_src
node pull_data.js
node merge-ny-times.js
node create-state-csv.js

cd ..

git add .
git commit -m "new data"
git push

#Move files to update map
cd 
cp ~/Desktop/Repository/coronashutdown/final_data/counties-cases.geojson ~/Desktop/Repository/Geojson_data
cp ~/Desktop/Repository/coronashutdown/final_data/counties-per-capita-cases.geojson ~/Desktop/Repository/Geojson_data
cp ~/Desktop/Repository/coronashutdown/final_data/state_confirmation_deaths.json ~/Desktop/Repository/Geojson_data

cd /home/panda/Desktop/Repository/Geojson_data

#Push to geojson_Data repo
git add .
git commit -m "new data"
git push

echo "Finish pulling data"
