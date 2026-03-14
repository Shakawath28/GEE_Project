// Description:
// This Google Earth Engine script analyzes atmospheric SO2 column number density 
// over Bangladesh using Sentinel-5P TROPOMI Level-3 data.

// Key Functions:
// - Filters Sentinel-5P SO2 data for Bangladesh (2021–2025)
// - Calculates yearly mean SO2 concentration
// - Visualizes yearly spatial distribution
// - Computes change between 2021 and 2025
// - Generates a time-series chart of mean SO2 values
// - Exports statistics to CSV for further analysis

// Dataset:
// COPERNICUS/S5P/OFFL/L3_SO2

// ---------------------------------------------------------------------
// Define the analysis period (2021–2025)
// This time range will be used to filter Sentinel-5P SO2 satellite data
// ---------------------------------------------------------------------

var date_1 = '2021'
var date_2 = '2026'

// ---------------------------------------------------------------------
// Load global country boundaries and extract Bangladesh boundary
// This boundary will be used to clip images and perform analysis
// ---------------------------------------------------------------------
var worldcountries = ee.FeatureCollection('USDOS/LSIB_SIMPLE/2017');
var filterCountry = ee.Filter.eq('country_na', 'Bangladesh');
var bangladesh = worldcountries.filter(filterCountry);

// ---------------------------------------------------------------------
// Load Sentinel-5P TROPOMI SO2 dataset
// Filter the dataset by:
// 1. Bangladesh boundary
// 2. Selected time period
// Then select the SO2 column number density band
// ---------------------------------------------------------------------
var col = ee.ImageCollection('COPERNICUS/S5P/OFFL/L3_SO2')
.filterBounds(bangladesh)
.filterDate(date_1, date_2)
.select('SO2_column_number_density')
.map(function(a){
  return a.set('year',ee.Image(a).date().get('year'))
})

//print(col)
// ---------------------------------------------------------------------
// Extract unique years from the image collection
// This will be used to calculate yearly average SO2 values
// ---------------------------------------------------------------------
var months = ee.List(col.aggregate_array('year')).distinct()
print(months)
// ---------------------------------------------------------------------
// For each year, calculate the mean SO2 concentration
// This creates one average image per year
// ---------------------------------------------------------------------
var mc = months.map(function(x){
  return col.filterMetadata('year','equals',x).mean().set('year',x)
})
print(mc)
print(months)
// ---------------------------------------------------------------------
// Convert the list of yearly images into an ImageCollection
// This allows easier visualization and time series analysis
// ---------------------------------------------------------------------
var final_image = ee.ImageCollection.fromImages(mc)
print(final_image,"final_image")
// ---------------------------------------------------------------------
// Extract yearly SO2 images and clip them to Bangladesh
// These images will be visualized on the map
// ---------------------------------------------------------------------
var img_2021=ee.Image(final_image.toList(final_image.size()).get(0)).clip(bangladesh)
var img_2022=ee.Image(final_image.toList(final_image.size()).get(1)).clip(bangladesh)
var img_2023=ee.Image(final_image.toList(final_image.size()).get(2)).clip(bangladesh)
var img_2024=ee.Image(final_image.toList(final_image.size()).get(3)).clip(bangladesh)
var img_2025=ee.Image(final_image.toList(final_image.size()).get(4)).clip(bangladesh)
Map.addLayer(img_2021,imageVisParam,"2021")
Map.addLayer(img_2022,imageVisParam,"2022")
Map.addLayer(img_2023,imageVisParam,"2023")
Map.addLayer(img_2024,imageVisParam,"2024")
Map.addLayer(img_2025,imageVisParam,"2025")

// ---------------------------------------------------------------------
// Create a time series chart showing yearly mean SO2 values
// across Bangladesh from 2021 to 2025
// ---------------------------------------------------------------------


var chart =ui.Chart.image
          .series(final_image, bangladesh,ee.Reducer.mean(), 1000, 'year')
        .setOptions({
          title: 'SO2 emission in Banladesh in 2021-2025',
          hAxis: {title: 'Year', ticks: [2021, 2022, 2023, 2024, 2025],titleTextStyle: {italic: false, bold: true}},
          vAxis: {
            title: 'SO2 column density (mol/m2)',
            titleTextStyle: {italic: false, bold: true}
          },
          lineWidth: 2,
          curveType: 'function'
        });
        
print(chart)
// ---------------------------------------------------------------------
// Calculate yearly mean SO2 values over Bangladesh
// These statistics will be stored in a FeatureCollection table
// ---------------------------------------------------------------------
var table = final_image.map(function(img) {

  var stats = img.reduceRegion({
    reducer: ee.Reducer.mean(),
    geometry: bangladesh,
    scale: 1000,          // MUST match chart scale
    maxPixels: 1e13
  });

  return ee.Feature(null, {
    month: img.get('month'),
    SO2_mean: stats.get('SO2_column_number_density')
  });
});
print(table,"table")

// ---------------------------------------------------------------------
// Export the SO2 statistics table to Google Drive as a CSV file
// This allows further analysis in Excel, Python, or GIS software
// ---------------------------------------------------------------------

Export.table.toDrive({
  collection: table,
  description: 'SO2_Bangladesh_2021_monthly_mean_1000m',
  fileFormat: 'CSV'
});




