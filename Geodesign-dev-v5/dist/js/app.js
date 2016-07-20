/* eslint-disable no-alert, no-console */
// "use strict";

var groupName = "";
var groupResults = []; // results for designs in the group
var groupResultsMemory; // dojo/store/Memory object, updates from groupResults[]
var designNames = []; // design names known to be used 
var watershedCenter = {northing: 413370.070, easting: 4905225.268};
var drawings = {drawn: [], current: [], previous: []}; // drawn keeps prID and geometry objects; current keeps current state, seeded on startup with practice graphics and null geometries
var selectedPractice;
var practiceDrawPicker;
var practiceDefsLayer;
var practiceSymbols = {};
var toolbar;
var hruLayer;
var hruCoverage;
var hruQuery;
var hruAcreage;
var biomassAverageYield = [
    null,         // 0 placeholder for 1-indexed practices
    null,         // 1 const
    5.43261398,   // 2 stover
    5.581417004,  // 3 stover+cover
    null,         // 4 lowp
    2.443173013,  // 5 prgr
    3.329967534,  // 6 swgr
    null          // 7 alf
];
var gpDesignResults;
var designCompleteUrl = "http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_Editor_DesignAll/FeatureServer/1";
var designCompleteLayer;
var designResultsLayer;
var designCompareLayer1;
var designCompareLayer2;
var designCompareLayer3;
var legendLayers = [];
var mapLayers = [];
var layerSliders = [];
var layerSliderDiv;
var layerSliderId;
var layerSliderDest;

var cornPriceSliderR;
var cornPriceSliderC;
var soyPriceSliderR;
var soyPriceSliderC;
var bioPriceSliderR;
var bioPriceSliderC;


// Base results generated using ~May 2016 data
var resultsBase = {
    "performance": {
        "phosphorusField": 3373.15472,
        "sedimentField": 630.65841,
        "habitat": 1786982.0,
        "phosphorusNonField": 1881.57836,
        "phosphorous": 5254.71797,
        "sedimentNonField": 2133.30797,
        "carbonSeq": 0.0,
        "yieldSoy": 25617.08712,
        "yieldBiomass": 0.0,
        "yieldCorn": 83782.06405,
        "sediment": 2763.96858,
        "waterYield": 1054.26055
    },
    "design": "base",
    "group": "[base]",
    "acreage": {
        "alf": 0,
        "const": 0,
        "cc": 0,
        "stov": 0,
        "swgr": 0,
        "base": 18416,
        "prgr": 0,
        "lowp": 0
    }
};

var modelParams = {
    priceCorn: 3.25,   // $/bushel
    priceSoy: 8.75,    // $/bushel
    priceBiomass: 50,  // $/short ton
    percentCorn: 0.55, // percent of corn in rotation
    area: 18416        // study area acreage; better to derive from results acreage instead of hardcode;; 18416 for server side, 18393 local?
};

var parcelsLayerUrl = "http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_Parcels/FeatureServer/0";
var parcelsLayer;
var parcelQuery;

var waterBufferLineUrl = "http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_Water_Features_Bufferable/FeatureServer/0";
var waterBufferPolygonUrl = "http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_Water_Features_Bufferable/FeatureServer/1";
var waterGeomLine;
var waterGeomPolygon;

var additionalLayers = {
    "reference": [
        {
            "name": "Section Lines",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_SectionLines/MapServer",
            "inLegend": false
        },
        {
            "name": "Roads",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_Roads/MapServer",
            "inLegend": false
        },
        {
            "name": "Water",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_Water/MapServer",
            "inLegend": false
        },
        {
            "name": "Hill Shade",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_ShadedRelief/MapServer",
            "inLegend": false
        },
        {
            "name": "Land Cover",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_LandCover/MapServer",
            "inLegend": true
        }
    ],
    "data": [
        {
            "name": "Wetland Restoration",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_RestorableWetland/MapServer",
            "inLegend": true
        },
        {
            "name": "Ecological & Wildlife",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_EcoPatchAndWildlifeMgmt/MapServer",
            "inLegend": true
        },
        {
            "name": "Perennial Cover Crops",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_PotentialPerennialAndCoverCropAreas/MapServer",
            "inLegend": true
        },
        {
            "name": "Crop Productivity",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_CropProductivity/MapServer",
            "inLegend": true
        },
        {
            "name": "Soil Erosion Risk",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_SoilErosionRisk/MapServer",
            "inLegend": true
        },
        {
            "name": "Water Quality Risk",
            "url": "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_WaterQualityRisk/MapServer",
            "inLegend": true
        }
    ]
};

require([
  // ArcGIS
    "esri/map",
    "esri/dijit/HomeButton",
    "esri/dijit/Legend",
    "esri/geometry/Point",
    "esri/SpatialReference",
    "esri/basemaps",
    "esri/layers/ArcGISTiledMapServiceLayer",
    "esri/layers/FeatureLayer",
    "dijit/form/HorizontalSlider",
    "esri/dijit/editing/TemplatePicker",
    "esri/toolbars/draw",
    "esri/symbols/SimpleMarkerSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/symbols/SimpleFillSymbol",
    "esri/Color",
    "esri/graphic",
    "esri/geometry/geometryEngine",
    "esri/tasks/Geoprocessor",
    "esri/tasks/query",
    "esri/tasks/QueryTask",

    "dojo/query",
    "dojo/store/Memory",

    "d3/d3",

    // Bootstrap
    "bootstrap/Collapse",
    "bootstrap/Dropdown",
    "bootstrap/Tab",
    "bootstrap/Modal",

    // Calcite Maps
    "calcite-maps/calcitemaps",
    "dojo/domReady!"
], function(Map, HomeButton, Legend, Point, SpatialReference, Basemaps, TiledLayer, FeatureLayer, HorizontalSlider, TemplatePicker, Draw, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, Graphic, GeometryEngine, Geoprocessor, Query, QueryTask, DojoQuery, Memory, d3) {

    var centerPoint,
        map, mapResults, mapCompare1, mapCompare2, mapCompare3,
        legend, layerType,
        watershedBoundaryTiledURL = "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_WatershedBoundary/MapServer",
        watershedBoundaryTiled,
        i;

    var eraseSymbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, null, new Color([255,255,255,0.7]));

    /**
     * If "debug" exists in the query string, don't disable context menu/right-clicking
     */
    if ((window.location.search).indexOf("debug") === -1) {
        $("body").contextmenu(function() {return false;});
    }

    /**
     * If "noparcels" exists in the query string, disable the parcel painting option
     */
    if ((window.location.search).indexOf("noparcels") !== -1) {
        $("#drawToolSelector option[value='POINT']").hide();
    }

    centerPoint = new Point(watershedCenter.northing, watershedCenter.easting, new SpatialReference({wkid: 26915}));

    Basemaps.sevenmc = {
        baseMapLayers: [{url: "http://gis.uspatial.umn.edu/arcgis/rest/services/Geodesign_7MC_Reference/7MC_Basemap/MapServer"}],
        title: "Seven Mile Creek Watershed"
    };

    // Map 
    map = new Map("mapViewDiv", {
        basemap: "sevenmc",
        center: centerPoint,
        zoom: 2,
        logo: false
    });

    var home = new HomeButton({map: map}, "HomeButton");
    home.startup();

    map.on("load", function() {
        // console.log("map loaded");
        setupPracticeDefinitions();
    });

    designCompleteLayer = new FeatureLayer(designCompleteUrl);
    designResultsLayer = new FeatureLayer(designCompleteUrl);
    designCompareLayer1 = new FeatureLayer(designCompleteUrl);
    designCompareLayer2 = new FeatureLayer(designCompleteUrl);
    designCompareLayer3 = new FeatureLayer(designCompleteUrl);

    designResultsLayer.setDefinitionExpression("group_name = 'impossible impossibility'");
    designCompareLayer1.setDefinitionExpression("group_name = 'impossible impossibility'");
    designCompareLayer2.setDefinitionExpression("group_name = 'impossible impossibility'");
    designCompareLayer3.setDefinitionExpression("group_name = 'impossible impossibility'");


    if (additionalLayers.hasOwnProperty("reference") || additionalLayers.hasOwnProperty("data")) {
        for (layerType in additionalLayers) {
            for (i = 0; i < additionalLayers[layerType].length; i += 1) {
                if (layerType === "reference" || layerType === "data") {
                    /**
                     * Prep TiledLayer objects to add to the map.
                     * Set opacity and visibility to 0 and false later on so that
                     * we may first use them to build a legend with visible
                     * symbology with opacity=1.
                     */
                    mapLayers.push(new TiledLayer(
                        additionalLayers[layerType][i].url,
                        {
                            id: additionalLayers[layerType][i].name,
                            title: additionalLayers[layerType][i].name,
                            className: (additionalLayers[layerType][i].inLegend) ? ("layer-" + layerType + " include-in-legend") : ("layer-" + layerType),
                            opacity: 0,
                            visible: false
                        }
                    ));
                    /**
                     * Also add copies to legendLayers for construction of a legend with opacity=1
                     * and visible. This is a LayerInfos-compatible object.
                     *
                     * It's a bit hokey, but we need a separate LayerInfos to pass in so the legend
                     * shows symbology and isn't tied to visibilty. Avoids callbacks/chains
                     * on mapLayers, where we could build the legend without building additional
                     * TiledLayer objects and then set opacity and visibility
                     * back to 0/false to avoid initial tile loads, and legend build takes a few
                     * requests and we don't want to hold up map drawing. Might be a non-issue
                     * when there's a splash screen.
                     */
                    if (additionalLayers[layerType][i].inLegend) {
                        // legendLayers.push({layer: mapLayers.slice(-1)[0], title: additionalLayers[layerType][i].name});
                        legendLayers.push({
                            layer: new TiledLayer(
                                additionalLayers[layerType][i].url,
                                {
                                    id: additionalLayers[layerType][i].name,
                                    title: additionalLayers[layerType][i].name,
                                    className: (additionalLayers[layerType][i].inLegend) ? ("layer-" + layerType + " include-in-legend") : ("layer-" + layerType)
                                }
                            ),
                            title: additionalLayers[layerType][i].name
                        });
                    }
                }
            }
        }
    }

    /**
     * Build sliders for the refernece and data layers
     */
    for (i = 0; i < mapLayers.length; i += 1) {
        layerSliderDest = ((mapLayers[i].className).indexOf("layer-reference") !== -1)
                            ? "layerSlidersReference"
                            : "layerSlidersData";
        layerSliderId = "layerSlider_" + (mapLayers[i].id).replace(/ /g, "_");
        layerSliderDiv = dojo.create("div");
        layerSliderDiv.setAttribute("id", layerSliderId);
        layerSliderDiv.innerHTML = '<span class="slider-layer-name">' + mapLayers[i].id + '</span>'
                                    + '<div id="' + layerSliderId + '_inner"></div>';
        dojo.byId(layerSliderDest).appendChild(layerSliderDiv);

        layerSliders[i] = new HorizontalSlider({
            name: mapLayers[i].id,
            title: "Change opacity of " + mapLayers[i].id,
            value: 0,
            minimum: 0,
            maximum: 1,
            discreteValues: 11,
            intermediateChanges: true,
            style: "width:300px;",
            onChange: function (value) {
                if (!map.getLayer(this.name).visible) {
                    map.getLayer(this.name).setVisibility(true); // in case it's still not visible from initial load
                }
                map.getLayer(this.name).setOpacity(value);
            }
        }, layerSliderId + "_inner").startup();
    }

    /**
     * Regenerate single results and compare results charts
     * Useful for 
     * @return {void}
     */
    function regenerateCharts() {
        if ($("#resultsDiv").html() !== "") {
            loadDesignResults($("#resultsDesignName select").children("option:selected").val(), false);
        }
        if ($("#compareDiv").html() !== "") {
            compareDesigns(false);
        }
        return;
    }

    /**
     * Update the price of corn in modelParams, sliders, display
     * @param  {number} value corn price in dollars
     * @return {void}
     */
    function updateCornPrice(value) {
        $(".price-control-current-corn").text("$" + value.toFixed(2));
        modelParams.priceCorn = value;
        cornPriceSliderR._setValueAttr(value);
        cornPriceSliderC._setValueAttr(value);
        regenerateCharts();
        return;
    }

    /**
     * Update the price of soybeans in modelParams, sliders, display
     * @param  {number} value corn price in dollars
     * @return {void}
     */
    function updateSoyPrice(value) {
        $(".price-control-current-soy").text("$" + value.toFixed(2));
        modelParams.priceSoy = value;
        soyPriceSliderR._setValueAttr(value);
        soyPriceSliderC._setValueAttr(value);
        regenerateCharts();
        return;
    }

    /**
     * Update the price of corn in modelParams, sliders, display
     * @param  {number} value corn price in dollars
     * @return {void}
     */
    function updateBiomassPrice(value) {
        $(".price-control-current-bio").text("$" + value.toFixed(2));
        modelParams.priceBiomass = value;
        bioPriceSliderR._setValueAttr(value);
        bioPriceSliderC._setValueAttr(value);
        regenerateCharts();
        return;
    }
    /**
     * Price sliders
     *
     * Go in #collapseResultsPrices > .panel-body
     */
    cornPriceSliderR = new HorizontalSlider({
        name: "cornPriceSliderR",
        title: "Corn price per bushel",
        value: 3.25,
        minimum: 2,
        maximum: 15,
        discreteValues: 53,
        intermediateChanges: true,
        onChange: updateCornPrice
    }, "cornPriceSliderR");

    cornPriceSliderC = new HorizontalSlider({
        name: "cornPriceSliderC",
        title: "Corn price per bushel",
        value: 3.25,
        minimum: 2,
        maximum: 15,
        discreteValues: 53,
        intermediateChanges: true,
        onChange: updateCornPrice
    }, "cornPriceSliderC");

    soyPriceSliderR = new HorizontalSlider({
        name: "soyPriceSliderR",
        title: "Soybeans price per bushel",
        value: 8.75,
        minimum: 5,
        maximum: 20,
        discreteValues: 61,
        intermediateChanges: true,
        onChange: updateSoyPrice
    }, "soyPriceSliderR");

    soyPriceSliderC = new HorizontalSlider({
        name: "soyPriceSliderC",
        title: "Soybeans price per bushel",
        value: 8.75,
        minimum: 5,
        maximum: 20,
        discreteValues: 61,
        intermediateChanges: true,
        onChange: updateSoyPrice
    }, "soyPriceSliderC");

    bioPriceSliderR = new HorizontalSlider({
        name: "bioPriceSliderR",
        title: "Biomass price per short ton",
        value: 50,
        minimum: 25,
        maximum: 125,
        discreteValues: 21,
        intermediateChanges: true,
        onChange: updateBiomassPrice
    }, "bioPriceSliderR");

    bioPriceSliderC = new HorizontalSlider({
        name: "bioPriceSliderC",
        title: "Biomass price per short ton",
        value: 50,
        minimum: 25,
        maximum: 125,
        discreteValues: 21,
        intermediateChanges: true,
        onChange: updateBiomassPrice
    }, "bioPriceSliderC");

    /**
     * Build legend for legendable layers
     */
    var legend = new Legend({
        map: map,
        layerInfos: legendLayers
    }, "legendDiv");
    legend.startup();

    /**
     * Add reference and data layers to the map
     */
    map.addLayers(mapLayers);

    watershedBoundaryTiled = new TiledLayer(watershedBoundaryTiledURL);
    map.addLayer(watershedBoundaryTiled);

    /**
     * Load the maps on the initially hidden tabs
     * when the tabs are switched to for the first time.
     * Allows for easy/proper calculation of initial extent,
     * instead of throwing off the initial extent when the
     * maps on the other tabs are initially hidden.
     */
    $("#navTabs a").click(function (e) {
        e.preventDefault();
        if ($(this).attr("aria-controls") == "results") {
            if (typeof mapResults === "undefined") {
                setTimeout(function() {
                    mapResults = new Map("mapResultsViewDiv", {
                        basemap: "sevenmc",
                        center: centerPoint,
                        zoom: 1,
                        logo: false
                    });
                    mapResults.addLayer(designResultsLayer);
                    mapResults.on("update-end", function() {
                        $("#loadingMask, #loadingSpinner").css("display", "none");
                    });
                }, 10);
            }
        }

        if ($(this).attr("aria-controls") == "compare") {
            if (typeof mapCompare1 === "undefined") {
                setTimeout(function() {
                    mapCompare1 = new Map("mapCompare1ViewDiv", {
                        basemap: "sevenmc",
                        center: centerPoint,
                        zoom: 0,
                        logo: false
                    });
                    mapCompare1.addLayer(designCompareLayer1);
                }, 10);
            }

            if (typeof mapCompare2 === "undefined") {
                setTimeout(function() {
                    mapCompare2 = new Map("mapCompare2ViewDiv", {
                        basemap: "sevenmc",
                        center: centerPoint,
                        zoom: 0,
                        logo: false
                    });
                    mapCompare2.addLayer(designCompareLayer2);
                }, 10);
            }

            if (typeof mapCompare3 === "undefined") {
                setTimeout(function() {
                    mapCompare3 = new Map("mapCompare3ViewDiv", {
                        basemap: "sevenmc",
                        center: centerPoint,
                        zoom: 0,
                        logo: false
                    });
                    mapCompare3.addLayer(designCompareLayer3);
                }, 10);
            }
        }
    });

    /**
     * Toggle the eraser tool
     */
    $("#drawToolErase").click(function() {
        if ($(this).hasClass("active")) {
            toolbar.deactivate();
        } else {
            practiceDrawPicker.clearSelection();
            toolbar.deactivate();
            activateTool(eraseSymbol, true);
        }
        $(this).toggleClass("active");
    });

    /**
     * Setup the undo last tool 
     */
    $("#drawToolUndo").click(function() {
        var practiceLoop;
        $(this).prop( "disabled", true );
        for (practiceLoop = 1; practiceLoop < drawings.current.length; practiceLoop += 1) {
            drawings.current[practiceLoop].setGeometry(drawings.previous[practiceLoop].geometry);
        }
        drawings.drawn.push({practiceId: -1, timestamp: Math.round(performance.now() / 100) / 10, undoLast: true});
        updateRunningAcreageTable();
    });

    /**
     * Stop drawing and erasing; deactivate everything
     */
    $("#drawToolStop").click(function() {
        practiceDrawPicker.clearSelection();
        $("#drawToolErase").removeClass("active");
        toolbar.deactivate();
    });

    /**
     * Clear all drawings
     */
    $("#drawToolClear").click(function() {
        if (window.confirm("Are you sure you wish to delete your entire drawing?")) {
            clearDrawing();
        }
    });

    function clearDrawing() {
        updatePreviousGeometries();
        var practiceLoop;
        drawings.drawn.push({practiceId: 0, timestamp: Math.round(performance.now() / 100) / 10, geometry: hruCoverage.getExtent()});
        for (practiceLoop = 1; practiceLoop < map.graphics.graphics.length; practiceLoop += 1) {
            if (map.graphics.graphics[practiceLoop].geometry !== null) {
                map.graphics.graphics[practiceLoop].setGeometry(null);
            }
        }
        updateRunningAcreageTable();
        $("#drawToolUndo").prop( "disabled", true );
    }

    $("#drawToolSelector").change(function() {
        if (practiceDrawPicker.getSelected()) {
            activateTool(practiceSymbols[practiceDrawPicker.getSelected().template.prototype.attributes.id].symbolTransp);
        }
        if ($("#drawToolSelector option:selected").val() == "POINT") {
            parcelsLayer.setVisibility(true);
        } else {
            parcelsLayer.setVisibility(false);
        }
    });

    function setupPracticeDefinitions() {
        practiceDefsLayer = new FeatureLayer("http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_PracticeDefinitions/FeatureServer/0",
                                                {orderByFields: ["id"]});

        practiceDefsLayer.on("Load", function () {
            // console.log("PDL loaded");
            createTemplatePicker([this]); // build the template (practice) picker
            createToolbar();
            // generate practice symbols for use all around
            // and default, null-geometry graphics
            $.each(this.renderer.infos, function (index, value) {
                practiceSymbols[value.value] = {
                    name: value.label,
                    symbol: value.symbol,
                    symbolTransp: value.symbol // use this for drawing
                };
                practiceSymbols[value.value].symbolTransp.color.a = 0.7; // set alpha/opacity for some transparency
                drawings.current[value.value] = new Graphic(
                    null,
                    practiceSymbols[value.value].symbolTransp,
                    {
                        practiceId: value.value,  // attributes are more for validation during dev
                        practice_id: value.value,
                        practiceName: value.label
                    }
                );

                map.graphics.add(drawings.current[value.value]);

                // init the previous state, too
                drawings.previous[value.value] = new Graphic(
                    null,
                    practiceSymbols[value.value].symbolTransp,
                    {
                        practiceId: value.value,  // attributes are more for validation during dev
                        practice_id: value.value,
                        practiceName: value.label
                    }
                );
            });
            setupParcelFeatures();
        });
    } // end setupPracticeDefinitions()

    /**
     * Add the parcels features layer, initially invisible
     * @return {void}
     */
    function setupParcelFeatures() {
        parcelsLayer = new FeatureLayer(parcelsLayerUrl, {visible: false});

        parcelsLayer.on("Load", function () {
            map.addLayer(parcelsLayer);
            setupBufferableWaterLine();
        });
    }

    /**
     * Add bufferable line water features layer
     * Visible with opacity zero to expose entries in the .graphics property
     * @return {void}
     */
    function setupBufferableWaterLine() {
        var waterBufferLineQueryTask = QueryTask(waterBufferLineUrl);
        var waterBufferLineQuery = new Query();
        waterBufferLineQuery.where = "objectid is not null";
        waterBufferLineQuery.returnGeometry = true;
        waterBufferLineQueryTask.on("complete", function(result) {
            waterGeomLine = result.featureSet.features[0].geometry;
            setupBufferableWaterPolygon();
        });
        waterBufferLineQueryTask.on("error", function(result) {
            console.log("query task error getting bufferable water (lines)", result);
        });

        waterBufferLineQueryTask.execute(waterBufferLineQuery);
    }

    /**
     * Add bufferable polygon water features layer
     * * Visible with opacity zero to expose entries in the .graphics property
     * @return {void}
     */
    function setupBufferableWaterPolygon() {
        var waterBufferPolygonQueryTask = QueryTask(waterBufferPolygonUrl);
        var waterBufferPolygonQuery = new Query();
        waterBufferPolygonQuery.where = "objectid is not null";
        waterBufferPolygonQuery.returnGeometry = true;
        waterBufferPolygonQueryTask.on("complete", function(result) {
            waterGeomPolygon = result.featureSet.features[0].geometry;
            setupHRUCoverage();
        });
        waterBufferPolygonQueryTask.on("error", function(result) {
            console.log("query task error getting bufferable water (polygon)", result);
        });

        waterBufferPolygonQueryTask.execute(waterBufferPolygonQuery);
    }

    function setupHRUCoverage() {
        hruLayer = new FeatureLayer("http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/7MC_HRU_Shapes/FeatureServer/0");

        hruQuery = new Query();
        hruQuery.where = "area_id = 6"; // study area is the watershed? need a where and 1=1 doesn't suffice?

        // load and store HRU coverage for intersections
        hruLayer.queryFeatures(hruQuery, function (featureSet) {
            // console.log("HRU query resolved");
            hruCoverage = featureSet.features[0].geometry;
            /**
             * Setup initial values for the running acreage table on app load
              */
            hruAcreage = GeometryEngine.planarArea(hruCoverage, "acres");
            dojo.byId("practiceRunning_8_acres").innerHTML = (Math.round(hruAcreage)).toLocaleString();
            dojo.byId("practiceRunning_8_percent").innerHTML = "100%";
            $("#loadingMask, #loadingSpinner").css("display", "none");
        }, function (error) {
            console.log("query error", error);
        });
    }



    function createTemplatePicker(layers) {
        practiceDrawPicker = new TemplatePicker({
            featureLayers: layers,
            columns: 3,
            rows: 3,
            items: [{label: "eraser", symbol: eraseSymbol}],
            showTooltip: true,
            style: "height: 100%; width: 100%;"
        }, "templatePickerDiv");
        practiceDrawPicker.startup();

        practiceDrawPicker.on("selection-change", function () {
            selectedPractice = practiceDrawPicker.getSelected();

            /**
             * If no practice is selected, deactivate the drawing tool.
             */
            if (selectedPractice === null) {
                toolbar.deactivate();
                $("#autobufferTool").prop("disabled", true);
            } else {
                // activate drawing tool using semi-transparent symbol for the chosen practice
                activateTool(practiceSymbols[selectedPractice.template.prototype.attributes.id].symbolTransp);
                $("#autobufferTool").prop("disabled", false);
            }
        });
    } /* end createTemplatePicker() */

    function activateTool(symbol, eraser) {
        var eraser = (typeof eraser !== "undefined") ? eraser : false,
            tool,
            toolLineSymbol;

        if (!eraser) {
            $("#drawToolErase").removeClass("active");
        }

        tool = eraser ? "FREEHAND_POLYGON" : drawToolSelector.options[drawToolSelector.selectedIndex].value;
        toolbar.activate(Draw[tool]);
        if (tool === "FREEHAND_POLYGON") {
            toolbar.setFillSymbol(symbol);
        } else {
            toolLineSymbol = new SimpleLineSymbol("STYLE_SOLID", symbol.getFill(), 4);
            toolbar.setLineSymbol(toolLineSymbol);
        }
    }

    function createToolbar() {
        toolbar = new Draw(map);
        toolbar.on("draw-end", addToMap);
    }

    function updatePreviousGeometries() {
        var practiceLoop;
        $("#drawToolUndo").prop( "disabled", false );
        for (practiceLoop = 1; practiceLoop < drawings.current.length; practiceLoop += 1) {
            drawings.previous[practiceLoop].setGeometry(drawings.current[practiceLoop].geometry);
        }
    }

    /**
     * Handle clicks on the autobuffer tool
     */
    $("#autobufferTool").click(function() {
        $("#loadingMask, #loadingSpinner").css("display", "block");

        // bufferWaterFeatures() going immediately prevents timely display of mask+spinner
        setTimeout(function() {
            bufferWaterFeatures();
        }, 100);
    });

    /**
     * Apply a buffer to all water features
     * Expects a single feature/graphic for line and poly water features
     * @return {void}
     */
    function bufferWaterFeatures() {
        var hruIntersectingGeometry, practiceLoop,
            practiceId = 0,
            endingDrawGeometry = null,
            waterGeom = null;

        updatePreviousGeometries();

        if (selectedPractice !== null && typeof selectedPractice !== "undefined") {
            practiceId = selectedPractice.template.prototype.attributes.id;
        }

        // union the water feature geometries and buffer
        waterGeom = GeometryEngine.union([
            GeometryEngine.buffer(waterGeomLine, drawToolPolylineBuffer.value, "feet", true),
            GeometryEngine.buffer(waterGeomPolygon, drawToolPolylineBuffer.value, "feet", true)
        ]);

        hruIntersectingGeometry = GeometryEngine.intersect(waterGeom, hruCoverage);
        if (map.graphics.graphics[practiceId].geometry === null) {
            map.graphics.graphics[practiceId].setGeometry(hruIntersectingGeometry);
        } else {
            map.graphics.graphics[practiceId].setGeometry(GeometryEngine.union([map.graphics.graphics[practiceId].geometry, hruIntersectingGeometry]));
        }

        endingDrawGeometry = map.graphics.graphics[practiceId].geometry;

        // update other geometries
        for (practiceLoop = 1; practiceLoop < map.graphics.graphics.length; practiceLoop += 1) {
            if (practiceLoop === practiceId) {
                continue;
            }

            if (map.graphics.graphics[practiceLoop].geometry !== null) {
                map.graphics.graphics[practiceLoop].setGeometry(GeometryEngine.difference(map.graphics.graphics[practiceLoop].geometry, endingDrawGeometry));
            }
        }

        updateRunningAcreageTable();
        $("#loadingMask, #loadingSpinner").css("display", "none");
    }

    function addToMap(evt) {
        var workingGeometry,
            hruIntersectingGeometry, practiceLoop,
            practiceId = 0,
            startingDrawGeometry = null,
            endingDrawGeometry = null,
            parcelGeom = null;

        /**
         * We need to do points/parcels one asynchronously due to reliance
         * on QueryTask. Maybe rewritable using geometryEngine.contains
         * for every parcel feature?
         */
        if (evt.geometry.type === "point") {
            for (i = 0; i < parcelsLayer.graphics.length; i += 1) {
                if (GeometryEngine.intersects(evt.geometry, parcelsLayer.graphics[i].geometry)) {
                    parcelGeom = parcelsLayer.graphics[i].geometry;
                    break;
                }
            }

            if (parcelGeom !== null) {
                if (selectedPractice !== null && typeof selectedPractice !== "undefined") {
                    practiceId = selectedPractice.template.prototype.attributes.id;
                }

                updatePreviousGeometries();

                hruIntersectingGeometry = GeometryEngine.intersect(parcelGeom, hruCoverage);
                if (map.graphics.graphics[practiceId].geometry === null) {
                    map.graphics.graphics[practiceId].setGeometry(hruIntersectingGeometry);
                } else {
                    map.graphics.graphics[practiceId].setGeometry(GeometryEngine.union([map.graphics.graphics[practiceId].geometry, hruIntersectingGeometry]));
                }

                endingDrawGeometry = map.graphics.graphics[practiceId].geometry;

                // update other geometries
                for (practiceLoop = 1; practiceLoop < map.graphics.graphics.length; practiceLoop += 1) {
                    if (practiceLoop === practiceId) {
                        continue;
                    }

                    if (map.graphics.graphics[practiceLoop].geometry !== null) {
                        map.graphics.graphics[practiceLoop].setGeometry(GeometryEngine.difference(map.graphics.graphics[practiceLoop].geometry, endingDrawGeometry));
                    }
                }

                updateRunningAcreageTable();
            }
        } else {
            // not a point/parcel
            updatePreviousGeometries();

             // Figure out whether we're drawing or erasing
            if (selectedPractice !== null && typeof selectedPractice !== "undefined") {
                practiceId = selectedPractice.template.prototype.attributes.id;
            }

            // Always save what the user drew
            drawings.drawn.push({practiceId: practiceId, practice_id: practiceId, timestamp: Math.round(performance.now() / 100) / 10, geometry: evt.geometry});

            // Drawing-specific actions
            if (practiceId !== 0) {
                startingDrawGeometry = drawings.current[practiceId].geometry;

                workingGeometry = (evt.geometry.type === "polyline")
                    ? GeometryEngine.buffer(evt.geometry, drawToolPolylineBuffer.value, "feet", true)
                    : evt.geometry;
                // intersect the drawn area with the HRUs
                hruIntersectingGeometry = GeometryEngine.intersect(workingGeometry, hruCoverage);

                // union the new geometry in with the existing practice geometry (which could be null)
                if (map.graphics.graphics[practiceId].geometry === null) {
                    map.graphics.graphics[practiceId].setGeometry(hruIntersectingGeometry);
                } else {
                    map.graphics.graphics[practiceId].setGeometry(GeometryEngine.union([map.graphics.graphics[practiceId].geometry, hruIntersectingGeometry]));
                }

                endingDrawGeometry = map.graphics.graphics[practiceId].geometry;
            } else {
                endingDrawGeometry = evt.geometry;
            }

            // update other geometries
            for (practiceLoop = 1; practiceLoop < map.graphics.graphics.length; practiceLoop += 1) {
                if (practiceLoop === practiceId) {
                    continue;
                }

                if (map.graphics.graphics[practiceLoop].geometry !== null) {
                    map.graphics.graphics[practiceLoop].setGeometry(GeometryEngine.difference(map.graphics.graphics[practiceLoop].geometry, endingDrawGeometry));
                }
            }

            updateRunningAcreageTable();
        }

    } /* end addToMap(evt) */

    // function updateRunningAcreageTable() {
    //     return true;
    // }

    /**
     * Update the running acreage table after draws, erases, loads, etc.
     */
    function updateRunningAcreageTable() {
        var i,
            iterAcres = 0,
            runningAcreage = hruAcreage,
            runningBiomass = 0,
            practiceBiomass = 0;

        for (i = 1; i < drawings.current.length; i += 1) {
            if (drawings.current[i].geometry !== null) {
                iterAcres = GeometryEngine.planarArea(drawings.current[i].geometry, "acres");
            } else {
                iterAcres = 0;
            }
            
            dojo.byId("practiceRunning_" + i + "_acres").innerHTML = (Math.round(iterAcres)).toLocaleString();
            dojo.byId("practiceRunning_" + i + "_percent").innerHTML = (Math.round(iterAcres * 1000 / hruAcreage) / 10) + "%";
            runningAcreage = runningAcreage - iterAcres;

            // Biomass average yields
            if (biomassAverageYield[i] !== null) {
                practiceBiomass = biomassAverageYield[i] * iterAcres;
                dojo.byId("practiceRunning_" + i + "_biomass").innerHTML = (Math.round(practiceBiomass)).toLocaleString();
                runningBiomass += practiceBiomass;
            }
        }

        dojo.byId("practiceRunning_8_acres").innerHTML = (Math.round(runningAcreage)).toLocaleString();
        dojo.byId("practiceRunning_8_percent").innerHTML = (Math.round(runningAcreage * 1000 / hruAcreage) / 10) + "%";
        dojo.byId("practiceRunning_total_biomass").innerHTML = (Math.round(runningBiomass)).toLocaleString();
    }

    /**
     * Get existing group design names
     */
    gpDesignResults = new Geoprocessor("http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/GetGroupDesignResults/GPServer/GetGroupDesignResults");
    function getGroupResultsHandler(jobInfo) {
        gpDesignResults.getResultData(jobInfo.jobId, "result", function (result) {
            for (var i = 0; i < result.value.length; i += 1) {
                if (result.value[i].group === groupName) {
                    groupResults.push(result.value[i]);
                    designNames.push(result.value[i].design);
                }
            }

            groupResultsMemory = new Memory({
                data: groupResults,
                idProperty: "design"
            });

            setExistingDesigns(designNames);
            $("#loadingMask, #loadingSpinner").css("display", "none");
        });
    }

    /**
     * Populate design name lists/selects
     */
    function setExistingDesigns(designNameList) {
        $(".group-design-names").html("").append("<option value=\"\" disabled selected>Choose a design</option>");

        $.each(designNameList, function(key, value) {
            $(".group-design-names").append("<option value=\"" + value + "\">" + value + "</option>");
        });        
    }

    $("#resultsDesignName select").change(function(e) {
        loadDesignResults($(this).children("option:selected").val());
    });

    function submitDesign(designName) {
        var designGraphics = [];
        $("#loadingMask, #loadingSpinner").css("display", "block");

        /**
         * try adding a new design and get the objectid for it
         *   fails: prompt user to save again
         *   success: save complete with objectid, save parts, process
         */

        // Assign [temporary/dev] design ID to complete graphics; copy them; send to server
        dojo.forEach(map.graphics.graphics.slice(1), function (item) {
            var drawingAttrs = item.attributes;
            item.attributes.group_name = groupName;
            item.attributes.design_name = designName;
            item.setAttributes(drawingAttrs);
            designGraphics.push(new Graphic(item.geometry, item.symbol, item.attributes, null));
        });

        // console.log("saving design for group '" + groupName + "' with design name of '" + designName + "'");
        designCompleteLayer.applyEdits(designGraphics, null, null, function () {
            var gpCurrentDesign = new Geoprocessor('http://us-dspatialgis.oit.umn.edu:6080/arcgis/rest/services/Geodesign_v4/ProcessDesign13Band/GPServer/ProcessDesign13Band');
            gpCurrentDesign.submitJob({"gname": groupName, "dname": designName}, function (jobInfo) {
                // console.log("submitted job has info", jobInfo);
                gpCurrentDesign.getResultData(jobInfo.jobId, "result", function (result) {
                    /**
                     * FIXME
                     * Bad handling for programmatic tab switch
                     * Standard .show()/.hide() not working properly
                     */
                    groupResultsMemory.put(result.value);
                    designNames.push(result.value.design);

                    designNames.sort(function (a, b) {
                        return a.toLowerCase().localeCompare(b.toLowerCase());
                    });
                    setExistingDesigns(designNames);
                    $("#resultsDesignName option[value='" + result.value.design + "']").prop("selected", true);
                    DojoQuery("#draw").removeClass("active");
                    DojoQuery("#navTabs li:first-child").removeClass("active");
                    DojoQuery("#results").addClass("active");
                    DojoQuery("#navTabs li:nth-child(2)").addClass("active");

                    /**
                     * Empty and dirty the design name input
                     */
                    DojoQuery("#designSaveName").val("");
                    $("#designSaveName").parent().removeClass("has-success").prop("aria-invalid", "true")
                           .children(".glyphicon").removeClass("glyphicon-ok").addClass("glyphicon-remove")
                           .siblings(".status-text").text("(invalid)")
                           .parents(".modal").find("button").prop("disabled", true);

                    loadDesignResults(result.value.design);
                });
            });
        },
        function (e) {
            console.log("error in applying edits", e);
        });
    }

    /**
     * Load an existing design from the group history
     */
    function loadDesign(designNameLoad) {
        var loadQuery = new Query();

        $("#loadingMask, #loadingSpinner").css("display", "block");

        designCompleteLayer.setDefinitionExpression("");
        loadQuery.where = "group_name = '" + groupName + "' AND design_name = '" 
                            + designNameLoad + "' AND practice_id <> 8";

        designCompleteLayer.queryFeatures(loadQuery, function(features) {
            var i;

            $("#drawToolUndo").prop( "disabled", true );

            // reset the current and previous drawings
            for (i = 1; i < 7; i += 1) {
                drawings.current[i].setGeometry(null);
                drawings.previous[i].setGeometry(null);
            }

            drawings.drawn = [];

            for (i = 0; i < features.features.length; i += 1) {
                drawings.current[features.features[i].attributes.practice_id]
                    .setGeometry(features.features[i].geometry);
            }

            updateRunningAcreageTable();
            $("#loadingMask, #loadingSpinner").css("display", "none");
        });
    } /* /loadDesign() */

    /**
     * Load results for an existing or newly-created design
     * on the results page. Init mapResults if not already
     * setup. FIXME simplify init handling with others
     */
    function loadDesignResults(resultsDesignName, loadGraphics) {
        if (loadGraphics === undefined) {
            loadGraphics = true;
        }
        if (typeof mapResults === "undefined") {
            setTimeout(function() {
                mapResults = new Map("mapResultsViewDiv", {
                    basemap: "sevenmc",
                    center: centerPoint,
                    zoom: 2,
                    logo: false
                });
                mapResults.addLayer(designResultsLayer);
                mapResults.on("update-end", function() {
                    $("#loadingMask, #loadingSpinner").css("display", "none");
                });
            }, 10);
        }

        if (loadGraphics) {
            $("#loadingMask, #loadingSpinner").css("display", "block");
            designResultsLayer.setDefinitionExpression("group_name = '" + groupName + "' AND design_name = '" + resultsDesignName + "'");            
        }    

        genResults(resultsDesignName, "resultsDiv");
    }

    $("#compareDesignName select").change(function(e) {
        compareDesigns();
    });

    /**
     * Generate charts, graphs, legends, etc. for
     * results. Baseline results should come in as
     * the first object in designResults
     * 
     * @param {string} designName  name of design
     * @param {string} destDiv     ID of div for results (without #)
     */
    function genResults(designName, destDiv) {
        var resultsSingle = dojo.byId(destDiv),
            marketReturnBase = 0,
            marketReturnDesign = 0,
            resultsDisplay = {},
            resultsDisplayStacked = {};

        resultsSingle.innerHTML = "";
        
        for (var key in resultsBase.performance) {
            if (resultsBase.performance.hasOwnProperty(key)) {
                resultsDisplay[key] = [resultsBase.performance[key]];
            }

            if (groupResultsMemory.get(designName).performance.hasOwnProperty(key)) {
                resultsDisplay[key].push(groupResultsMemory.get(designName).performance[key]);
            }
        }

        resultsDisplayStacked.sediment = [
            {
                // base
                total: Math.round(resultsBase.performance.sedimentField) + Math.round(resultsBase.performance.sedimentNonField),
                field: Math.round(resultsBase.performance.sedimentField),
                nonField: Math.round(resultsBase.performance.sedimentNonField)
            },
            {
                total: Math.round(groupResultsMemory.get(designName).performance["sedimentField"])
                     + Math.round(groupResultsMemory.get(designName).performance["sedimentNonField"]),
                field: Math.round(groupResultsMemory.get(designName).performance["sedimentField"]),
                nonField: Math.round(groupResultsMemory.get(designName).performance["sedimentNonField"])
            }
        ];

        resultsDisplayStacked.phosphorus = [
            {
                // base
                total: Math.round(resultsBase.performance.phosphorusField) + Math.round(resultsBase.performance.phosphorusNonField),
                field: Math.round(resultsBase.performance.phosphorusField),
                nonField: Math.round(resultsBase.performance.phosphorusNonField)
            },
            {
                total: Math.round(groupResultsMemory.get(designName).performance["phosphorusField"])
                     + Math.round(groupResultsMemory.get(designName).performance["phosphorusNonField"]),
                field: Math.round(groupResultsMemory.get(designName).performance["phosphorusField"]),
                nonField: Math.round(groupResultsMemory.get(designName).performance["phosphorusNonField"])
            }
        ];

        marketReturnBase = userInputs(
            resultsBase.performance.yieldCorn * 2000 / 56 / modelParams.area,
            modelParams.priceCorn,
            resultsBase.performance.yieldSoy * 2000 / 60 / modelParams.area,
            modelParams.priceSoy,
            resultsBase.performance.yieldBiomass / modelParams.area,
            modelParams.priceBiomass,
            modelParams.percentCorn,
            modelParams.area
        );

        // Biomass value from prairie grass and switch grass
        // Biomass from stover is fed into the economics/userInputs function and ignores acreage from prgr and swgr practices
        marketReturnDesign = (groupResultsMemory.get(designName).performance.yieldBiomassOther * modelParams.priceBiomass);

        // Cover crop costs
        // Deduct $47/acre for cover crop acreages
        marketReturnDesign -= (groupResultsMemory.get(designName).acreage.cc * 47);

        // Calculate alfalfa acreage
        // Alfalfa area in soy is already reduced to 60% (CAAAS years) for yield, but acreage is NOT
        // Take the would-be soy yield from the alfalfa acreage (yieldAlfalfaInSoy) and multiply by soy cost
        // Then add $30/acre (taking 60% of CAAAS practice acreage)
        // And subtract $262.46/ac for practice costs (on 60% of CAAAS practice acreage)
        // And work in alfalfa-corn and alfalfa-soy yields to the main economics script, along with that 40% acreage
        marketReturnDesign += groupResultsMemory.get(designName).performance.yieldAlfalfaInSoy * 2000 / 60 * modelParams.priceSoy;
        marketReturnDesign += (groupResultsMemory.get(designName).acreage.alf * .6) * 30;
        marketReturnDesign -= (groupResultsMemory.get(designName).acreage.alf * .6) * 262.46;

        // Rest of the practices, plus adjusted corn and soy yields from alfalfa, go into main economics scripts
        // That's 40% of acreage.alf that goes into this
        var econMainAcreage = groupResultsMemory.get(designName).acreage.base +
                                groupResultsMemory.get(designName).acreage.cc +
                                groupResultsMemory.get(designName).acreage.const +
                                groupResultsMemory.get(designName).acreage.lowp +
                                groupResultsMemory.get(designName).acreage.stov +
                                0.4 * groupResultsMemory.get(designName).acreage.alf;

        // multiply alfalfa-acreage corn yield by inverse of percent of corn in rotation to avoid double-reducing it (already at 20% absolute)
        var econMainCornTons = groupResultsMemory.get(designName).performance.yieldCorn +
                                (1 - modelParams.percentCorn) * groupResultsMemory.get(designName).performance.yieldCornFromAlf;
        var econMainCornBushels = econMainCornTons * 2000 / 56;

        var econMainSoyTons = groupResultsMemory.get(designName).performance.yieldSoy +
                                (1 - modelParams.percentCorn) * groupResultsMemory.get(designName).performance.yieldSoyFromAlf;
        var econMainSoyBushels = econMainSoyTons * 2000 / 60;

        var econMainBiomass = groupResultsMemory.get(designName).performance.yieldBiomassStover * modelParams.percentCorn;

        marketReturnDesign += userInputs(
            (econMainAcreage === 0) ? 0 : econMainCornBushels / econMainAcreage,
            modelParams.priceCorn,
            (econMainAcreage === 0) ? 0 : econMainSoyBushels / econMainAcreage,
            modelParams.priceSoy,
            (econMainAcreage === 0) ? 0 : econMainBiomass / econMainAcreage,
            modelParams.priceBiomass,
            modelParams.percentCorn,
            econMainAcreage
        );

        addResultGraphicStacked(resultsDisplayStacked.sediment, destDiv, "Sediment", "(t/yr)");
        addResultGraphicStacked(resultsDisplayStacked.phosphorus, destDiv, "Phosphorus", "(lb/yr)");
        addResultGraphic(resultsDisplay.waterYield, destDiv, "Water yield", "(ft/yr)");
        addResultGraphic(resultsDisplay.habitat, destDiv, "Habitat Quality", "")
        addResultGraphic([marketReturnBase, marketReturnDesign], destDiv, "Market Return", "($/yr)");

        d3.select("#" + destDiv)
            .append("div")
            .attr("class", "legend")
            .append("svg")
            .attr("height", 300)
            .attr("width", 250)
            .attr("style", "margin-right:0;")
            .attr("viewBox", "0 0 250 300")
            .html("<g transform=\"translate(30, 70)\"><g class=\"chart-nonfield\"><rect height=\"80\" style=\"fill:#1f77b4\" width=\"80\" x=\"0\" y=\"110\"></rect><rect height=\"80\" style=\"fill:#ff7f0e\" width=\"80\" x=\"80\" y=\"110\"></rect><text fill=\"#16537e\" font-size=\"16px\" text-anchor=\"middle\" x=\"40\" y=\"155\">non-field</text><text fill=\"#b3590a\" font-size=\"16px\" text-anchor=\"middle\" x=\"120\" y=\"155\">non-field</text></g><g class=\"chart-field\"><rect height=\"80\" style=\"fill:#8fbbda\" width=\"80\" x=\"0\" y=\"30\"></rect><rect height=\"80\" style=\"fill:#ffbf87\" width=\"80\" x=\"80\" y=\"30\"></rect><text fill=\"#16537e\" font-size=\"16px\" text-anchor=\"middle\" x=\"40\" y=\"75\">field</text><text fill=\"#b3590a\" font-size=\"16px\" text-anchor=\"middle\" x=\"120\" y=\"75\">field</text></g><g class=\"chart-title\" transform=\"translate(0, 210)\"><text font-size=\"16px\" text-anchor=\"middle\" x=\"40\" y=\"0\">base</text><text font-size=\"16px\" text-anchor=\"middle\" x=\"120\" y=\"0\">new</text></g></g>");

        d3.select("#" + destDiv)
            .append("div")
            .attr("class", "acreage-table")
            .attr("id", "acreageTableSingle");

        dojo.byId("acreageTableSingle").innerHTML = makeAcreageTable([groupResultsMemory.get(designName)]);

        // Carbon sequestration at 9.31/t/ac/yr for grasses, 1.34 t/ac/yr for alfalfa (take 60% of acreage)
        var actualCarbonSeq = 0;
        actualCarbonSeq += (9.31 * (groupResultsMemory.get(designName).acreage.prgr + groupResultsMemory.get(designName).acreage.swgr));
        actualCarbonSeq += (1.34 * 0.6 * groupResultsMemory.get(designName).acreage.alf);

        $("#acreageTableSingle").prepend("<p>");
        d3.select("#acreageTableSingle p").attr("id", "resultsSingleCarbonSeq").attr("style", "text-align:center;font-size:16px;").html("<strong>Carbon sequestration</strong><br>" + (Math.round(actualCarbonSeq)).toLocaleString() + " t/yr");
    }

    /**
     * Calculate values from designs for display
     * Calls graphic generation functions 
     * @param  {array} designSet array of design names
     * @param  {string} destDiv     ID of div for results (without #)
     * @return {void}
     */
    function genCompare(designSet, destDiv) {
        var resultsCompare = dojo.byId(destDiv),
            marketReturnBase = 0,
            marketReturnDesign = [],
            resultsDisplay = {},
            resultsDisplayStacked = {},
            actualCarbonSeq = 0;

        resultsCompare.innerHTML = "";

        for (var key in resultsBase.performance) {
            if (resultsBase.performance.hasOwnProperty(key)) {
                resultsDisplay[key] = [resultsBase.performance[key]];
            }

            for (var i = 0; i < designSet.length; i += 1) {
                if (groupResultsMemory.get(designSet[i]).performance.hasOwnProperty(key)) {
                    if (key !== "carbonSeq") {
                        resultsDisplay[key].push(groupResultsMemory.get(designSet[i]).performance[key]);
                    } else {
                        actualCarbonSeq = 0;
                        actualCarbonSeq += (9.31 * (groupResultsMemory.get(designSet[i]).acreage.prgr + groupResultsMemory.get(designSet[i]).acreage.swgr));
                        actualCarbonSeq += (1.34 * 0.6 * groupResultsMemory.get(designSet[i]).acreage.alf);
                        resultsDisplay[key].push(actualCarbonSeq);
                    }
                }
            }
        }

        resultsDisplayStacked.sediment = [
            {
                // base
                total: Math.round(resultsBase.performance.sedimentField) + Math.round(resultsBase.performance.sedimentNonField),
                field: Math.round(resultsBase.performance.sedimentField),
                nonField: Math.round(resultsBase.performance.sedimentNonField)
            }
        ];

        resultsDisplayStacked.phosphorus = [
            {
                // base
                total: Math.round(resultsBase.performance.phosphorusField) + Math.round(resultsBase.performance.phosphorusNonField),
                field: Math.round(resultsBase.performance.phosphorusField),
                nonField: Math.round(resultsBase.performance.phosphorusNonField)
            }
        ];

        for (var i = 0; i < designSet.length; i += 1) {
            resultsDisplayStacked['sediment'].push(
                {
                    total: Math.round(groupResultsMemory.get(designSet[i]).performance['sedimentField'])
                           + Math.round(groupResultsMemory.get(designSet[i]).performance['sedimentNonField']),
                    field: Math.round(groupResultsMemory.get(designSet[i]).performance['sedimentField']),
                    nonField: Math.round(groupResultsMemory.get(designSet[i]).performance['sedimentNonField'])
                }
            );

            resultsDisplayStacked['phosphorus'].push(
                {
                    total: Math.round(groupResultsMemory.get(designSet[i]).performance['phosphorusField'])
                           + Math.round(groupResultsMemory.get(designSet[i]).performance['phosphorusNonField']),
                    field: Math.round(groupResultsMemory.get(designSet[i]).performance['phosphorusField']),
                    nonField: Math.round(groupResultsMemory.get(designSet[i]).performance['phosphorusNonField'])
                }
            );
        }

        marketReturnBase = userInputs(
            resultsBase.performance.yieldCorn * 2000 / 56 / modelParams.area,
            modelParams.priceCorn,
            resultsBase.performance.yieldSoy * 2000 / 60 / modelParams.area,
            modelParams.priceSoy,
            resultsBase.performance.yieldBiomass / modelParams.area,
            modelParams.priceBiomass,
            modelParams.percentCorn,
            modelParams.area
        );

        var percentGrass,
            biomassGrass,
            biomassNonGrass,
            acreageNonGrass;

        for (i = 0; i < designSet.length; i += 1) {
            // Biomass value from prairie grass and switch grass
            // Biomass from stover is fed into the economics/userInputs function and ignores acreage from prgr and swgr practices
            marketReturnDesign[i] = (groupResultsMemory.get(designSet[i]).performance.yieldBiomassOther * modelParams.priceBiomass);

            // Cover crop costs
            // Deduct $47/acre for cover crop acreages
            marketReturnDesign[i] -= (groupResultsMemory.get(designSet[i]).acreage.cc * 47);

            // Calculate alfalfa acreage
            // Alfalfa area in soy is already reduced to 60% (CAAAS years) for yield, but acreage is NOT
            // Take the would-be soy yield from the alfalfa acreage (yieldAlfalfaInSoy) and multiply by soy cost
            // Then add $30/acre (taking 60% of CAAAS practice acreage)
            // And subtract $262.46/ac for practice costs (on 60% of CAAAS practice acreage)
            // And work in alfalfa-corn and alfalfa-soy yields to the main economics script, along with that 40% acreage
            marketReturnDesign[i] += groupResultsMemory.get(designSet[i]).performance.yieldAlfalfaInSoy * 2000 / 60 * modelParams.priceSoy;
            marketReturnDesign[i] += (groupResultsMemory.get(designSet[i]).acreage.alf * .6) * 30;
            marketReturnDesign[i] -= (groupResultsMemory.get(designSet[i]).acreage.alf * .6) * 262.46;

            // Rest of the practices, plus adjusted corn and soy yields from alfalfa, go into main economics scripts
            // That's 40% of acreage.alf that goes into this
            var econMainAcreage = groupResultsMemory.get(designSet[i]).acreage.base +
                                    groupResultsMemory.get(designSet[i]).acreage.cc +
                                    groupResultsMemory.get(designSet[i]).acreage.const +
                                    groupResultsMemory.get(designSet[i]).acreage.lowp +
                                    groupResultsMemory.get(designSet[i]).acreage.stov +
                                    0.4 * groupResultsMemory.get(designSet[i]).acreage.alf;

            // multiply alfalfa-acreage corn yield by inverse of percent of corn in rotation to avoid double-reducing it (already at 20% absolute)
            var econMainCornTons = groupResultsMemory.get(designSet[i]).performance.yieldCorn +
                                    (1 - modelParams.percentCorn) * groupResultsMemory.get(designSet[i]).performance.yieldCornFromAlf;
            var econMainCornBushels = econMainCornTons * 2000 / 56;

            var econMainSoyTons = groupResultsMemory.get(designSet[i]).performance.yieldSoy +
                                    (1 - modelParams.percentCorn) * groupResultsMemory.get(designSet[i]).performance.yieldSoyFromAlf;
            var econMainSoyBushels = econMainSoyTons * 2000 / 60;

            var econMainBiomass = groupResultsMemory.get(designSet[i]).performance.yieldBiomassStover * modelParams.percentCorn;

            marketReturnDesign[i] += userInputs(
                (econMainAcreage === 0) ? 0 : econMainCornBushels / econMainAcreage,
                modelParams.priceCorn,
                (econMainAcreage === 0) ? 0 : econMainSoyBushels / econMainAcreage,
                modelParams.priceSoy,
                (econMainAcreage === 0) ? 0 : econMainBiomass / econMainAcreage,
                modelParams.priceBiomass,
                modelParams.percentCorn,
                econMainAcreage
            );
        }

        addResultGraphicStacked(resultsDisplayStacked.sediment, destDiv, "Sediment", "(t/yr)");
        addResultGraphicStacked(resultsDisplayStacked.phosphorus, destDiv, "Phosphorus", "(lb/yr)");
        addResultGraphic(resultsDisplay.waterYield, destDiv, "Water yield", "(ft/yr)");
        addResultGraphic(resultsDisplay.habitat, destDiv, "Habitat Quality", "")
        addResultGraphic(([marketReturnBase]).concat(marketReturnDesign), destDiv, "Market Return", "($/yr)");
        addResultGraphic(resultsDisplay.carbonSeq, destDiv, "Carbon Sequestration", "(t/yr)");

        var designSetPass = [];
        for (i = 0; i < designSet.length; i += 1) {
            designSetPass.push(groupResultsMemory.get(designSet[i]));
        }

        makeCompareLegend(designSet, destDiv);

        d3.select("#" + destDiv)
            .append("div")
            .attr("class", "acreage-table")
            .attr("id", "acreageTableCompare");

        dojo.byId("acreageTableCompare").innerHTML = makeAcreageTable(designSetPass);

        return;
    }

    /**
     * Add an SVG bar chart
     * @param {array}  dataset  array of numeric values
     * @param {string} destDiv  ID of div to append to (no #)
     * @param {string} title1   primary title for chart
     * @param {string} title2   secondary title
     */
    function addResultGraphic(dataset, destDiv, title1, title2) {
        var margin = {top: 50, right: 0, bottom: 40, left: 0},
            widthTotal = 250,
            heightTotal = 300,
            width = widthTotal - margin.left - margin.right,
            height = heightTotal - margin.top - margin.bottom,
            datasetMax = d3.max(dataset),
            title2 = (typeof title2 !== "undefined") ? title2 : "",
            colors = d3.scale.category10(),
            svg = d3.select("#" + destDiv).append("div").append("svg")
                .attr("width", widthTotal)
                .attr("height", heightTotal)
                .attr("viewBox", "0 0 " + widthTotal + " " + heightTotal)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var barPadding = 0;

        svg.append("g")
            .attr("class", "chart-total");

        svg.append("g")
            .attr("class", "chart-title")
            .attr("transform", "translate(0, " + (height + 20) + ")");

        var resTotal = svg.selectAll(".chart-total");
        var resTitle = svg.selectAll(".chart-title");

        resTotal.selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
                .style("fill", function (d, i) {return colors(i); })
                .attr("x", function (d, i) {return i * (width / dataset.length); })
                .attr("y", function (d) {return height - (height / datasetMax * d);})
                .attr("width", width / dataset.length - barPadding)
                .attr("height", function(d) {
                    if (d < 0) {
                        return 0;
                    } else {
                        return height / datasetMax * d; 
                    }
                });

        resTotal.selectAll("text")
            .data(dataset)
            .enter()
            .append("text")
                .text(function (d) {
                    if (d >= 1000000 || d <= -1000000) {
                        return ((Math.round(d/1000) / 1000).toLocaleString() + "M");
                    } else {
                        return (Math.round(d)).toLocaleString();
                    }
                })
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    return i * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                })
                .attr("y", function (d) {
                    if (d < 0) {
                        return height;
                    } else {
                        return height - (height / datasetMax * d) - 5;
                    }
                });

        if (dataset[0] > 0) {
            var j;
            for (j = 1; j < dataset.length; j += 1) {
                svg.append("text")
                    .text(function() {
                        var val = Math.round(((dataset[j] - dataset[0]) / ((dataset[0]))) * 1000) / 10;
                        return ((val > 0) ? "+" : "") + val + "%";
                    })
                    .attr("text-anchor", "middle")
                    .attr("x", function(d, i) {
                        return j * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                    })
                    .attr("y", 0)
                    .attr("transform", "translate(0, " + ((-(parseInt(margin.top)) )+ 15) +  ")");             
            }
        }

        resTitle.append("text")
            .text(title1)
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 0);

        resTitle.append("text")
            .text(title2)
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", 16);
    }

    /**
     * Add an SVG bar chart with stacked results for field and nonField sources
     * @param {array}  dataset  array of objects with field, nonField, and total properties
     * @param {string} destDiv  ID of div to append to (no #)
     * @param {string} title1   primary title for chart
     * @param {string} title2   secondary title
     */
    function addResultGraphicStacked(dataset, destDiv, title1, title2) {
        var margin = {top: 50, right: 0, bottom: 40, left: 0},
            widthTotal = 250,
            heightTotal = 300,
            width = widthTotal - margin.left - margin.right,
            height = heightTotal - margin.top - margin.bottom,
            datasetMax = d3.max(dataset, function (d) {return d.total;}),
            title2 = (typeof title2 !== 'undefined') ? title2 : "",
            colors = d3.scale.category10(),
            j,
            svg = d3.select("#" + destDiv).append("div").append("svg")
                    .attr("width", widthTotal)
                    .attr("height", heightTotal)
                    .attr("viewBox", "0 0 " + widthTotal + " " + heightTotal)
                .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        var barPadding = 0;

        svg.append("g")
            .attr("class", "chart-nonfield");

        svg.append("g")
            .attr("class", "chart-field");

        svg.append("g")
            .attr("class", "chart-total");

        svg.append("g")
            .attr("class", "chart-title")
            .attr("transform", "translate(0, " + (height + 20) + ")");

        var resNonField = svg.selectAll('.chart-nonfield');
        var resField = svg.selectAll('.chart-field');
        var resTotal = svg.selectAll('.chart-total');
        var resTitle = svg.selectAll('.chart-title');

        resNonField.selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
                .style("fill", function (d, i) {return colors(i); })
                .attr("x", function (d, i) {return i * (width / dataset.length); })
                .attr("y", function (d) {return height - (height / datasetMax * d.nonField);})
                .attr("width", width / dataset.length - barPadding)
                .attr("height", function(d) {return height / datasetMax * d.nonField; });

        resField.selectAll("rect")
            .data(dataset)
            .enter()
            .append("rect")
                .style("fill", function (d, i) {return colorLightnessAdjust(colors(i), 0.5); })
                .attr("x", function (d, i) {return i * (width / dataset.length); })
                .attr("y", function (d) {return height - (height / datasetMax * d.total);})
                .attr("width", width / dataset.length - barPadding)
                .attr("height", function(d) {return height / datasetMax * d.field; });

        resNonField.selectAll("text")
            .data(dataset)
            .enter()
            .append("text")
                .text(function (d) {
                    return (Math.round(d.nonField)).toLocaleString();
                })
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    return i * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                })
                .attr("y", function (d) {
                    return height - (height / datasetMax * d.nonField) + 16;
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", function (d, i) {
                    return colorLightnessAdjust(colors(i), -0.3);
                });

        resField.selectAll("text")
            .data(dataset)
            .enter()
            .append("text")
                .text(function (d) {
                    return (Math.round(d.field)).toLocaleString();
                })
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    return i * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                })
                .attr("y", function (d) {
                    return height - (height / datasetMax * d.total) + 16;
                })
                .attr("font-family", "sans-serif")
                .attr("font-size", "12px")
                .attr("fill", function (d, i) {
                    return colorLightnessAdjust(colors(i), -0.3);
                });

        resTotal.selectAll("text")
            .data(dataset)
            .enter()
            .append("text")
                .text(function (d) {
                    return (Math.round(d.total)).toLocaleString();
                })
                .attr("text-anchor", "middle")
                .attr("x", function (d, i) {
                    return i * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                })
                .attr("y", function (d) {
                    return height - (height / datasetMax * d.total) - 5;
                });

        resTitle.append("text")
          .text(title1)
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 0);

        resTitle.append("text")
          .text(title2)
          .attr("text-anchor", "middle")
          .attr("x", width / 2)
          .attr("y", 16);

        if (dataset[0].total !== 0) {
            for (j = 1; j < dataset.length; j += 1) {
                svg.append("text")
                    .text(function() {
                        var val = Math.round(((dataset[j].total - dataset[0].total) / ((dataset[0].total))) * 1000) / 10;
                        return ((val > 0) ? "+" : "") + val + "%";
                    })
                    .attr("text-anchor", "middle")
                    .attr("x", function(d, i) {
                        return j * (width / dataset.length) + (width / dataset.length - barPadding) / 2;
                    })
                    .attr("y", 0)
                    .attr("font-size", "14px")
                    .attr("transform", "translate(0, " + ((-(parseInt(margin.top)) )+ 15) +  ")");             
            }
        }
    }

    /**
     * Make an HTML table describing acreage for a set of designs
     * @param  {array} designSet  array of design results project
     * @return {string}           table HTML
     */
    function makeAcreageTable(designSet) {
        var i, key,
            result,
            designSetAdj = $.extend(true, {}, designSet);

        for (i = 0; i < designSet.length; i += 1) {
            for (key in designSetAdj[i].acreage) {
                designSetAdj[i].acreage[key] = (designSetAdj[i].acreage[key] === 0) ? "" : ((Math.round((designSetAdj[i].acreage[key] / modelParams.area) * 1000))/10 + "%");
            }
        }

        result = "<table class=\"table table-bordered table-striped table-condensed\"><thead><tr><th colspan=\"" + (designSet.length + 1) + "\">Percent of Acreage by Practice</th></tr>";


        if (designSet.length > 1) {
            result += "<tr><th></th>";
            for (i = 0; i < designSet.length; i += 1) {
                result += "<th>" + (designSetAdj[i].design).toLocaleString() + "</th>";
            }

            result += "</tr>";            
        }

        result += "</thead><tbody>";

        result += "<tr><th>Base</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.base).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Alfalfa</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.alf).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Conservation Tillage</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.const).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Low Phosphorus</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.lowp).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Stover Removal</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.stov).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Stover and Cover Crop</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.cc).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Prairie Grass</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.prgr).toLocaleString() + "</td>";
        }
        result += "</tr>";

        result += "<tr><th>Switchgrass</th>";
        for (i = 0; i < designSet.length; i += 1) {
            result += "<td>" + (designSetAdj[i].acreage.swgr).toLocaleString() + "</td>";
        }
        result += "</tr>";
        result += "</tbody></table>";

        return result;
    }

    /**
     * Generate an SVG legend of designs
     * @param  {array}   designNames  array of design names
     * @param  {string}  destDiv      ID of destination div (no "#")
     * @return {void}
     */
    function makeCompareLegend(designNames, destDiv) {
        designNames.unshift("base model");
        var width = 250,
            height = 300,
            widthPer = width / designNames.length,
            color = d3.scale.category10(),
            svg = d3.select("#" + destDiv)
                    .append("div")
                    .attr("class", "legend")
                    .attr("id", "compareLegend")
                    .append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("viewBox", "0 0 " + width + " " + height);

        svg.selectAll("rect")
            .data(designNames)
            .enter()
            .append("g")
                .append("rect")
                    .attr("x", function (d, i) { return widthPer * i; })
                    .attr("width", widthPer)
                    .attr("height", 260)
                    .attr("fill", function (d, i) {return color(i); });

        svg.selectAll("g rect.inField")
            .data(designNames)
            .enter()
            .append("rect")
                .attr("class", "inField")
                .attr("x", function (d, i) {return widthPer * i; })
                .attr("width", widthPer)
                .attr("height", 60)
                .attr("fill", function (d, i) { return colorLightnessAdjust(color(i), 0.5); });


        svg.selectAll("text.name")
            .data(designNames)
            .enter()
            .append("text")
                .attr("class", "name")
                .attr("x", function (d, i) {return widthPer * (i + 0.5) - 10; })
                .attr("y", 250)
                .attr("fill", "#000")
                .attr("font-weight", "bold")
                .attr("text-anchor", "left")
                .attr("font-size", "20px")
                .attr("alignment-baseline", "middle")
                .attr("transform", function (d, i) {
                    return "rotate(270, " + (widthPer * (i + 0.5) - 10) + ", 250)";
                })
                .text(function (d, i) {return designNames[i]; });

        svg.selectAll("text.inField")
            .data(designNames)
            .enter()
            .append("text")
                .attr("class", "inField")
                .attr("x", function (d, i) {return widthPer * (i + 0.5) + 10; })
                .attr("y", 30)
                .attr("fill", function (d, i) { return colorLightnessAdjust(color(i), -0.3); })
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("alignment-baseline", "middle")
                .attr("transform", function (d, i) {
                    return "rotate(270, " + (widthPer * (i + 0.5) + 10) + ", 30)";
                })
                .text("field");

        svg.selectAll("text.nonField")
            .data(designNames)
            .enter()
            .append("text")
                .attr("class", "nonField")
                .attr("x", function (d, i) {return widthPer * (i + 0.5) + 10; })
                .attr("y", 250)
                .attr("fill", function (d, i) { return colorLightnessAdjust(color(i), -0.3); })
                .attr("text-anchor", "left")
                .attr("font-size", "16px")
                .attr("alignment-baseline", "middle")
                .attr("transform", function (d, i) {
                    return "rotate(270, " + (widthPer * (i + 0.5) + 10) + ", 250)";
                })
                .text("non-field");
    }


    /**
     * Compare up to three saved designs to base
     */
    function compareDesigns(loadGraphics) {
        if (loadGraphics === undefined) {
            loadGraphics = true;
        }
        var validDesigns = [],
            proposedDefExp,
            noResultsDefExp = "group_name = 'impossible impossibility' AND design_name = 'impossible impossibility'";

        if (dojo.byId("compareDesignName1").value !== null && dojo.byId("compareDesignName1").value !== "") {
            validDesigns.push(dojo.byId("compareDesignName1").value);

            if (loadGraphics) {
                proposedDefExp = "group_name = '" + groupName + "' AND design_name = '" + dojo.byId("compareDesignName1").value + "'";
                if (designCompareLayer1.getDefinitionExpression() !== proposedDefExp) {
                    designCompareLayer1.setDefinitionExpression(proposedDefExp);
                }
            }
        } else if (loadGraphics) {
            designCompareLayer1.setDefinitionExpression(noResultsDefExp);
        }

        if (dojo.byId("compareDesignName2").value !== null && dojo.byId("compareDesignName2").value !== "") {
            validDesigns.push(dojo.byId("compareDesignName2").value);

            if (loadGraphics) {
                proposedDefExp = "group_name = '" + groupName + "' AND design_name = '" + dojo.byId("compareDesignName2").value + "'";
                if (designCompareLayer2.getDefinitionExpression() !== proposedDefExp) {
                    designCompareLayer2.setDefinitionExpression(proposedDefExp);
                }
            }
        } else if (loadGraphics) {
            designCompareLayer2.setDefinitionExpression(noResultsDefExp);
        }

        if (dojo.byId("compareDesignName3").value !== null && dojo.byId("compareDesignName3").value !== "") {
            validDesigns.push(dojo.byId("compareDesignName3").value);

            if (loadGraphics) {
                proposedDefExp = "group_name = '" + groupName + "' AND design_name = '" + dojo.byId("compareDesignName3").value + "'";
                if (designCompareLayer3.getDefinitionExpression() !== proposedDefExp) {
                    designCompareLayer3.setDefinitionExpression(proposedDefExp);
                }
            }
        } else if (loadGraphics) {
            designCompareLayer3.setDefinitionExpression(noResultsDefExp);
        }

        genCompare(validDesigns, "compareDiv");
    }

    DojoQuery("#groupNameModal").modal({keyboard: false});

    // ugly focus change handling
    setTimeout(function() {
        $("#groupName").focus();
    }, 1000);

    DojoQuery("#groupNameModal button").on("click", function() {
        DojoQuery("#groupNameModal").modal("hide");
        $("#loadingMask, #loadingSpinner").css("display", "block");
        groupName = DojoQuery("#groupName").val();
        DojoQuery(".group-name-display").html(groupName);
        gpDesignResults.submitJob({"gname": groupName}, getGroupResultsHandler);
    });

    // not very DRY
    DojoQuery("#groupNameChoose").on("submit", function(e) {
        dojo.stopEvent(e);
        DojoQuery("#groupNameModal").modal("hide");
        $("#loadingMask, #loadingSpinner").css("display", "block");
        groupName = DojoQuery("#groupName").val();
        DojoQuery(".group-name-display").html(groupName);
        gpDesignResults.submitJob({"gname": groupName}, getGroupResultsHandler);
    });

    DojoQuery("#designLoadModal button").on("click", function() {
        loadDesign(DojoQuery("#loadDesignName").val());
        DojoQuery("#designLoadModal").modal("hide");
    });

    DojoQuery("#designToolSave").on("click", function() {
        submitDesign(DojoQuery("#designSaveName").val());
    });

    DojoQuery("#designSaveLoad").on("submit", function(e) {
        dojo.stopEvent(e);
        submitDesign(DojoQuery("#designSaveName").val());
    });

    DojoQuery("#basemapToggler").on("click", function() {
        map.getLayer(map.basemapLayerIds[0]).setVisibility(!map.getLayer(map.basemapLayerIds[0]).visible);
    });

});// dojo

/**
 * Validate the design name for saving
 * Must be alphanumeric, with spaces and hyphens allowed
 * Can't start with space or hyphen
 * Must not already exist
 */
$("#designSaveName").keyup(function() {
    var name = $(this).val(),
        re = /^[A-Za-z]+[\w -]*$/;

    if (name.match(re) && designNames.indexOf(name) === -1) {
        $(this).parent().removeClass("has-error").addClass("has-success").prop("aria-invalid", "false")
               .children(".glyphicon").removeClass("glyphicon-remove").addClass("glyphicon-ok")
               .siblings(".status-text").text("(ok)");
        $("#designToolSave").prop("disabled", false);
    } else {
        $(this).parent().removeClass("has-success").addClass("has-error").prop("aria-invalid", "true")
               .children(".glyphicon").removeClass("glyphicon-ok").addClass("glyphicon-remove")
               .siblings(".status-text").text("(invalid)");
        $("#designToolSave").prop("disabled", true);
    }
});

/**
 * Validate the design name for saving
 * Must be alphanumeric, with spaces and hyphens allowed
 * Can't start with space or hyphen
 */
$("#groupNameChoose input").keyup(function() {
    var name = $(this).val(),
        re = /^[A-Za-z]+[\w -]*$/;

    if (name.match(re)) {
        $(this).parent().removeClass("has-error").addClass("has-success").prop("aria-invalid", "false")
               .children(".glyphicon").removeClass("glyphicon-remove").addClass("glyphicon-ok")
               .siblings(".status-text").text("(ok)")
               .parents(".modal").find("button").prop("disabled", false);
    } else {
        $(this).parent().removeClass("has-success").addClass("has-error").prop("aria-invalid", "true")
               .children(".glyphicon").removeClass("glyphicon-ok").addClass("glyphicon-remove")
               .siblings(".status-text").text("(invalid)")
               .parents(".modal").find("button").prop("disabled", true);
    }
});

/**
 * Lighten/darken colors
 * @param {string} color hex color with #
 * @param {number} percent percentage (try -1 to 1) to darken/lighten a color
 * 
 */
function colorLightnessAdjust(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}
