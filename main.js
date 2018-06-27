var app = {};

app.createConstants  = function(){
  app.CSV = 'data.csv';
  app.GJSON = 'district.geojson';
};

app.createHelpers = function(){
  // read csv from file
  app.readCSV = function(){
    $.ajax({
      url:app.CSV,
      success:function(data){
        // console.log(data);
      }
    });
  }

  app.loadGeojson = function(){
    app.geomLoading = $.ajax({
        dataType : 'json',
        url :app.GJSON,
        success: function(fcoll){
          app.activeLayer = L.geoJson(fcoll,{color:'#222222',fillOpacity:"0", weight:"1.5"}).addTo(app.map);
          console.log(app.activeLayer);
          app.geomCache[l1] = fcoll;
          app.map.fitBounds(app.activeLayer.getBounds());
          // applyMask(fcoll);
        }
      });
  }
};

// initialize UI
app.initUI = function(){
  app.map = L.map('map').setView([27, 84], 4);
  app.baseMap = L.tileLayer('https://api.mapbox.com/styles/v1/banmedo/ciiibvf1k0011alki4gp6if1s/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmFubWVkbyIsImEiOiJhSklqeEZzIn0.rzfSxO3cVUhghA2sJN378A');
  app.baseMap.addTo(app.map);
};

app.initialize = function(){
  app.createConstants();
  app.createHelpers();

  app.initUI();
  app.loadGeojson();
  app.readCSV();
};

app.initialize();
