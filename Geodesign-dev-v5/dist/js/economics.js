/*
Copyright University of Minnesota Board of Regents
Last Updated: February 10, 2016 by Bryan Runck


******* Overview ********
This script takes in corn grain, soybean, and biomass yields and produces AREA-WIDE net return. In other words, this
script considers the net returns of everyone within an area. If the desired output is on a per acre or hectare basis, the script
will need to be altered.



*******  HISTORY  ********


The logic of this script comes from Bill Lazarus of UMN Applied Economics. He performed an 
economic analysis of corn/soy crop rotation.

Up to date versions of Bill's economcis analysis can be found at http://wlazarus.cfans.umn.edu/william-lazarus-spreadsheet-decision-tools/

The specific file this script was built from is SevenMile_lazmacros122414c.xlsm, which was originally
created on December 24, 2014, emailed to David Pitt, and then emailed to Bryan Runck. The file
contains macros that update a spreadsheet created by David Mulla of UMN Soil, Water and Climate.

This specific implementation was developed by Bryan Runck (UMN, Geography, Environment and Society)
in collaboration with Peter Wringa and Len Kne of U-Spatial.

******* Inputs *******

The script requires eight numbers as input:

Biophysical
- corn grain yield in total area bushels
- soybean yield in total area bushels
- biomass yield in total area short tons
Note: these are not area referenced; the script will calculate the total economic value for the entire area.

Prices
-price of corn in $/bushel
-price of soy in $/bushel
-price of biomass in $/ton

Cropping System Ratio
- ratio of corn and soybeans in rotation (i.e. .5 is 50% corn, 50% soybeans in the rotation)

Area
- the areal extent of the study area in acres; this is used to calculate costs

******* Outputs *******

- dollars of agricultural goods for the entire area in acres


******* Economic Assumptions *******

Costs
-seed
-fees, roundup fee
-Nutrients, 
-chemicals, herbicide, pesticides
-machinery, labor + depreciation?
-
-non machine labor, management labor, other labor
-operating interest; six month interest rate, loan amount
-land costs; currently not included --> we should estimate this based on the percentage of the landscape rented versus owned ??? http://landeconomics.umn.edu/MLE/landdata/LandValue/RunReport.aspx?RI=1475922

Varying by Yield
-fertilizer, P lb/bu yield, K lb/bu yield, N?
-Seeding rate/bu yield
-harvest, drying, storage
-Yields, ST/A
-Bu/ST

*/


//Will calculate the output values on HTML click
function calculate(){


  var cornYield = document.getElementById("cornYield").value,
    cornPrice = document.getElementById("cornPrice").value,

    soyYield = document.getElementById("soyYield").value,
    soyPrice = document.getElementById("soyPrice").value,
  
    biomassYield = document.getElementById("biomassYield").value,
    biomassPrice = document.getElementById("biomassPrice").value,
  
    percentCorn = document.getElementById("percentCorn").value,
    area = document.getElementById("area").value;
  
  document.getElementById("netReturn").innerHTML = userInputs(cornYield, cornPrice, soyYield, soyPrice, biomassYield, biomassPrice, percentCorn, area);

}

function userInputs(cornYield, cornPrice, soyYield, soyPrice, biomassYield, biomassPrice, percentCorn, area){
  var result = totalValue(netValueCalc(cornYield, cornPrice, cornCosts(cornYield)),
            netValueCalc(soyYield,soyPrice, soyCosts(soyYield)),
            netValueCalc(biomassYield,biomassPrice, biomassCosts(biomassYield)),
            percentCorn)
  return Math.ceil(result*100*area)/100; //round off; scale to area

}


function netValueCalc(yield, price, costs) {
  return (yield * price) - costs;
}


function totalValue (cornVal, soyVal, biomassVal, percentCorn) {
  return (cornVal * percentCorn) + (soyVal * (1-percentCorn)) + biomassVal;
}




function cornCosts(cYield){
  
  //seed
  var seedingRatePerBushel = 0.2125, //per bushel of previous yield
    seedingRate = cYield * seedingRatePerBushel,
    seedPrice = 3.5, //IS THIS CORRECT??
    roundUpFee = 10,
    seed = seedingRate * seedPrice + roundUpFee;
  // console.log("Corn Seed: " + seed);
  
  //fertilizer
  var nPrice = 0.41, // $/unit
    pPrice = 0.35,
    kPrice = 0.38,
    nperBushelRate = 1.2, //yield goal method...
    pperBushelRate = 0.1875,
    kperBushelRate = 0.3125,
    nCost = cYield * nperBushelRate * nPrice, // FORM?? Currently canceling out
    pCost = cYield * pperBushelRate * pPrice, //P2O5
    kCost = cYield * kperBushelRate * kPrice, //K2O
    fertApplicationCost = 10,
    fertilizer = nCost + pCost + kCost + fertApplicationCost;  
  // console.log("Corn Fertilizer: " + fertilizer);
  
  //crop chemicals
  var glyphosate = 44,// 5.5L (oz)
    glyphCost = .2,
    AMS = 3, //(qt)
    amsCost = 1.5,
    //In Bill's spreadsheet, without amounts
    /*axial = 0, // (oz)
    axialCost = 1.5,
    headline = 0, // (oz)
    headlineCost =  3.18,
    prosario = 0, // (oz)
    prosarioCost = 2.13,
    silencer = 0, // (oz)
    silencerCost = 1,
    raptor = 0, // (oz)
    raptorCost = 4.1, */
    cropChemApplication = 14,
    chemicals = glyphosate * glyphCost + AMS * amsCost + cropChemApplication;
  // console.log("Corn Chemicals: " + chemicals);
  
  //crop insurance and miscellaneous
  var cropInsurance = 0,
    miscellaneous = 30.2564; // not sure where this number comes from ??
  
  //machinery costs + labor passes per acre (same corn/beans except for combine)
  var chiselPlowPass = 1, //37 ft.
    chiselCost = 10.04,
    cultivatorPass  = 2, //60 ft.
    cultivatorCosts = 5.42,
    planterPass = 1, //Row Crop Planter 24 Row-30, 60 Ft
    planterCosts = 13.68,
    rowCultivatorPass = 1,
    rowCultivatorCosts = 7.39, //Row Cultivator 12 Row-30, 30 Ft
    combineCorn = 1, // Hd chop 8 Row-30, 20ft
    combineCornCost = 37.83,
    grainCart = 1,
    grainCartCosts = 21.34;
    machinery = chiselPlowPass*chiselCost + cultivatorPass*cultivatorCosts +
      planterPass*planterCosts+rowCultivatorPass*rowCultivatorCosts+
      combineCorn*combineCornCost+grainCart*grainCartCosts;
    // console.log("Corn Machinery: " + machinery);
    
  //Crop drying, transport & storage
  var dryTranStore = cYield * 0.125; //0.125 scalar
  // console.log("Corn Crop drying, transport & storage: " + dryTranStore);
  
  //non-machinery & management labor
  var nonMachineLabor = 68.7985;
  // console.log("Corn non-machinery labor: " + nonMachineLabor);
  
  //interest on operating expenses;
  var interestRate = .05, // annual
    operatingExpenses = seed + fertilizer + chemicals + cropInsurance + miscellaneous +
    machinery + dryTranStore + nonMachineLabor,
    interest = operatingExpenses*interestRate/2;
  // console.log("Corn interest on operating expenses: " + interest);

  //land costs ?? Currently not included 

  var cCosts = seed + fertilizer + chemicals + cropInsurance + miscellaneous +
    machinery + dryTranStore + nonMachineLabor + interest;
  // console.log("Total Corn Costs: " + cCosts);
  return cCosts;
}




function soyCosts(sYield){
//seed
  var seedingRatePerBushel = 0.025, //per bushel of previous yield
    seedingRate = sYield * seedingRatePerBushel,
    seedPrice = 50, //IS THIS CORRECT??
    roundUpFee = 10,
    seed = seedingRate * seedPrice + roundUpFee;
  // console.log("Soy Seed: " + seed);
  
  //fertilizer
  var nPrice = 0.41, // $/unit
    pPrice = 0.35,
    kPrice = 0.38,
    nperBushelRate = 0,
    pperBushelRate = 0.25,
    kperBushelRate = 0.125,
    nCost = sYield * nperBushelRate * nPrice,
    pCost = sYield * pperBushelRate * pPrice, //P2O5
    kCost = sYield * kperBushelRate * kPrice, //K2O
    fertApplicationCost = 0, //why is this 0?
    fertilizer = nCost + pCost + kCost + fertApplicationCost;  
  // console.log("Soy Fertilizer: " + fertilizer);
  
  //crop chemicals
  var glyphosate = 48,// 5.5L (oz)
    glyphCost = .2,
    AMS = 3, //(qt)
    amsCost = 1.5,
    //In Bill's spreadsheet, without amounts
    /*axial = 0, // (oz)
    axialCost = 1.5,
    headline = 0, // (oz)
    headlineCost =  3.18,
    prosario = 0, // (oz)
    prosarioCost = 2.13,
    silencer = 0, // (oz)
    silencerCost = 1,
    raptor = 0, // (oz)
    raptorCost = 4.1, */
    cropChemApplication = 14,
    chemicals = glyphosate * glyphCost + AMS * amsCost + cropChemApplication;
  // console.log("Soy Chemicals: " + chemicals);
  
  //crop insurance and miscellaneous
  var cropInsurance = 0,
    miscellaneous = 20.8517; // not sure where this number comes from ??
  
  //machinery costs + labor passes per acre (same Soy/beans except for combine)
  var chiselPlowPass = 1, //37 ft.
    chiselCost = 10.04,
    cultivatorPass  = 2, //60 ft.
    cultivatorCosts = 5.42,
    planterPass = 1, //Row Crop Planter 24 Row-30, 60 Ft
    planterCosts = 13.68,
    rowCultivatorPass = 1,
    rowCultivatorCosts = 7.39, //Row Cultivator 12 Row-30, 30 Ft
    combineSoy = 1, // Hd chop 8 Row-30, 20ft
    combineSoyCost = 36.68,
    grainCart = 1,
    grainCartCosts = 21.34;
    machinery = chiselPlowPass*chiselCost + cultivatorPass*cultivatorCosts +
      planterPass*planterCosts+rowCultivatorPass*rowCultivatorCosts+
      combineSoy*combineSoyCost+grainCart*grainCartCosts;
    // console.log("Soy Machinery: " + machinery);
    
  //Crop drying, transport & storage
  var dryTranStore = sYield * 0.05; //0.125 scalar
  // console.log("Soy Crop drying, transport & storage: " + dryTranStore);
  
  //non-machinery & management labor
  var nonMachineLabor = 42.0585;
  // console.log("Soy non-machinery labor: " + nonMachineLabor);
  
  //interest on operating expenses;
  var interestRate = .05, // annual
    operatingExpenses = seed + fertilizer + chemicals + cropInsurance + miscellaneous +
    machinery + dryTranStore + nonMachineLabor,
    interest = operatingExpenses*interestRate/2;
  // console.log("Soy interest on operating expenses: " + interest);

  //land costs ?? Currently not included 

  var sCosts = seed + fertilizer + chemicals + cropInsurance + miscellaneous +
    machinery + dryTranStore + nonMachineLabor + interest;
  // console.log("Total Soy Costs: " + sCosts);
  return sCosts;
}




function biomassCosts(bYield){
  //model assumes direct payment from processing plant; no costs;
  return 0;
}






