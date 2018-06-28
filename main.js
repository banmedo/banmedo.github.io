var app = {};

app.createConstants  = function(){
  app.CSV = 'data.csv';
  app.LABELS = 'dataLabels.csv';
  app.GJSON = 'district.geojson';
  app.NAMEINDEX = 1;
  app.GEOMNAMEFIELD = 'DISTRICT';
  app.COLORS = [
    ['#FFEDA0','#800026'],
    ['#000','#FFF'],
    ['#FFF','#00F']
  ];
  app.COLORNAMES = [
    'Yellow To Brown',
    'Black To White',
    'White To Blue'
  ]
};

app.createHelpers = function(){
  // read csv from file
  app.readCSV = function(){
    app.csvLoading = $.ajax({
      url:app.CSV,
      success:function(data){
        var data = $.csv.toArrays(data);
        app.dataArray = data.splice(1);
        app.dataObject = {};
        for (var i=0; i<app.dataArray.length; i++){
          app.dataObject[app.dataArray[i][app.NAMEINDEX].toUpperCase()] = app.dataArray[i];
        }
        app.headers = data[0];
        app.readDataLabels();
      }
    });
  }
  // read data labels from csv
  app.readDataLabels = function(){
    app.csvLoading = $.ajax({
      url:app.LABELS,
      success:function(data){
        var data = $.csv.toArrays(data);

        var labelArray = data.splice(1);
        // console.log(labelArray);
        app.labelObject = {};
        for (var i=0; i<labelArray.length; i++){
          var label = labelArray[i][0];
          var fields = labelArray[i][1].split(',');
          for (var j = 0; j<fields.length;j++){
            app.labelObject[fields[j].trim()] = label;
          }
        }
        app.buildDropdownControl(app.headers);
      }
    });
  }
  // load district geojson
  app.loadGeojson = function(){
    app.geomLoading = $.ajax({
      dataType : 'json',
      url :app.GJSON,
      success: function(fcoll){
        app.featureCollection = fcoll;
        app.layer = L.geoJson(fcoll,{
          style:{color:'#222222',fillOpacity:"0", weight:"1.5"},
          onEachFeature: function(feature, layer){
            layer.on('click',app.showLayerData);
          }
        }).addTo(app.map);
        app.map.fitBounds(app.layer.getBounds());
        app.readCSV();
      }
    });
  }
  // build dropdown data control
  app.buildDropdownControl = function (array){
    if(app.dropdown) app.map.removeControl(app.dropdown);
    app.dropdown = L.control({position: 'topright'});
    app.dropdown.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info dropdown');
        var html = '<select id="dataDropdown" onchange="app.dropdownChanged()" style="width:220px">';
        for (var i = app.NAMEINDEX+1; i< array.length; i++){
          var label = (app.labelObject[array[i]])?(app.labelObject[array[i]]+"<i> ("+array[i]+")<i>"):("<i>("+array[i]+")</i>");
          html += '<option value="'+array[i]+'">'+label+'</option>';
        }
        html += '</select>'
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.dropdown.addTo(app.map);
    $("#dataDropdown").select2();
    app.dropdownChanged();
  }
  // build dropdown data control
  app.buildGradientControl = function (){
    if(app.gradientControl) app.map.removeControl(app.gradientControl);
    app.gradientControl = L.control({position: 'topright'});
    app.gradientControl.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info dropdown');
        var html = '<select id="gradientDropdown" style="width:220px" onchange="app._applyGradient()">';
        for (var i = 0; i< app.COLORS.length; i++){
          html += '<option value = '+i+'>'+app.COLORNAMES[i]+'</option>';
        }
        html += '</select>';
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.gradientControl.addTo(app.map);
    $("#gradientDropdown").select2({templateResult: app._styleSelect2});
  }
  // style gradient select2
  app._styleSelect2 = function(state){
    if (state.loading) return state;
    var index = parseInt($(state.element).val());
    html = '<div style="width:200px;height:10px;background: linear-gradient(to right, '+app.COLORS[index][0]+' , '+app.COLORS[index][1]+');"></div>'
    return $(html);
  }
  app._applyGradient = function (){
    var gradIndex = $("#gradientDropdown").val();
    var gradient = GradientGenerator.createGradient(app.COLORS[gradIndex]);
    app.layer.eachLayer(function(thislayer){
      var data = thislayer.feature.properties.data;
      var ratio = (data - app.minData)/ (app.maxData - app.minData);
      thislayer.setStyle({fillColor:gradient.getColorHexAt(ratio),fillOpacity:"0.8", weight:"1", opacity:1, color:'black'})
    });
    app._updateLegend();
  }
  // handle data view changed
  app.dropdownChanged = function(e){
    var selectedData = $("#dataDropdown").val();
    var selectedIndex = app.headers.indexOf(selectedData);
    // var filteredData = app.dataArray.map(function(item){return [item[1],item[selectedIndex]]});
    app.dataType = 'int';
    var maxData = undefined, minData = undefined;
    app.layer.eachLayer(function(thislayer){
      var name = thislayer.feature.properties[app.GEOMNAMEFIELD];
      var data = app.dataObject[name][selectedIndex];
      try{
        if (app.dataType != 'str') data = parseInt(data);
        if (minData === undefined) minData = data;
        else if (data <= minData) minData = data;
        if (maxData === undefined) maxData = data;
        else if (data >= maxData) maxData = data;
      }catch(error){
        app.dataType = 'str';
      }
      thislayer.feature.properties.data = data;
    });
    app.minData = minData;
    app.maxData = maxData;

    app._applyGradient();
  }
  // update the legend
  app._updateLegend = function(){
    if (app.legend) app.map.removeControl(app.legend);
    var gradIndex = parseInt($("#gradientDropdown").val());
    var gradient = GradientGenerator.createGradient(app.COLORS[gradIndex]);
    app.legend = L.control({position: 'bottomright'});
    app.legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var field = $("#dataDropdown").val();
        var label = (app.labelObject[field])?(app.labelObject[field]+"<i> ("+field+")<i>"):("<i>("+field+")</i>");
        var html = '<h4 class="legend-title" style="margin:5px">Legend</h4>';
        html += '<h5 class="legend-field" style="margin:5px"><i>'+label+'</i></h5>';
        html += '<span class="legend-label">'+app.maxData+'</span>';
        var startColor = app.COLORS[gradIndex][0];
        var endColor = app.COLORS[gradIndex][1];
        html += '<div style="height:200px;width:10px;background: linear-gradient('+endColor+' , '+startColor+')">&nbsp;</div>'
        html += '<span class="legend-label">'+app.minData+'</span>';
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.legend.addTo(app.map);
    $("#gradientDropdown").select2({templateResult: app._styleSelect2});
  }
  app.showLayerData = function(e){
    var name = e.sourceTarget.feature.properties[app.GEOMNAMEFIELD];
    var thisdata = app.dataObject[name];
    $('.modal-title').html(name);
    var contenthtml = '<table id="data-table">';
    for (var i = app.NAMEINDEX+1; i< app.headers.length; i++){
      var head = app.headers[i];
      var data = thisdata[i];
      // console.log(head,data);
      contenthtml+= '<tr><th>'+head+'</th><td>'+data+'</td>';
    }
    contenthtml += '</table>';
    $('.modal-body').html(contenthtml);
    $('#dataModal').modal('show');

  }
};

// initialize UI
app.initUI = function(){
  app.map = L.map('map').setView([27, 84], 4);
  app.baseMap = L.tileLayer('https://api.mapbox.com/styles/v1/banmedo/cj5djv3ym0ij62sobk6h0s47b/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmFubWVkbyIsImEiOiJhSklqeEZzIn0.rzfSxO3cVUhghA2sJN378A');
  app.baseMap.addTo(app.map);
  app.buildGradientControl();
};

app.initialize = function(){
  app.createConstants();
  app.createHelpers();

  app.initUI();
  app.loadGeojson();
  // app.readCSV();
};

app.initialize();
