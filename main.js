var app = {};

app.createConstants  = function(){
  app.CSV = 'data.csv'
};

app.createHelpers = function(){
  // read csv from file
  app.readCSV = function(){
    $.ajax({
      url:app.CSV,
      success:function(data){
        console.log(data);
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
  app.readCSV();
};

app.initialize();
