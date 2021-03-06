var app = {};

app.createConstants  = function(){
  app.CSV = 'data.csv';
  app.LABELS = 'dataLabels.csv';
  app.GJSON = 'district.geojson';
  app.NAMEINDEX = 1;
  app.HEADERLINE = 1;
  app.CATEGORYINDEX = 0;
  app.SUBCATINDEX = 1;
  app.LABELINDEX = 2;
  app.FIELDINDEX = 3;
  // app.BASELAYER = 'https://api.mapbox.com/styles/v1/banmedo/cj5djv3ym0ij62sobk6h0s47b/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmFubWVkbyIsImEiOiJhSklqeEZzIn0.rzfSxO3cVUhghA2sJN378A';
  app.BASELAYER = 'https://api.mapbox.com/styles/v1/banmedo/cjbkm07iu27kp2sqzrxsyteiv/tiles/256/{z}/{x}/{y}?access_token=pk.eyJ1IjoiYmFubWVkbyIsImEiOiJhSklqeEZzIn0.rzfSxO3cVUhghA2sJN378A';
  app.GEOMNAMEFIELD = 'DISTRICT';
  app.COLORS = [
    ['Yellow To Brown','#FFEDA0','#800026'],
    ['Black To White','#000','#FFF'],
    ['White To Blue','#FFF','#00F']
  ];
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
        app.dataCategories = {};
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
        var labelArray = data.splice(app.HEADERLINE);
        // console.log(labelArray);
        app.labelObject = {};
        app.shortLabelObject = {};
        app.categoryObject = {};
        for (var i=0; i<labelArray.length; i++){
          var category = labelArray[i][app.CATEGORYINDEX];
          var subcategory = labelArray[i][app.SUBCATINDEX];
          var label = labelArray[i][app.LABELINDEX];
          var field = labelArray[i][app.FIELDINDEX];
          app.labelObject[field.trim()] = (label == '')? subcategory:(subcategory+' - '+label);
          app.shortLabelObject[field.trim()] = (label == '')? subcategory:label;
          if (! app.categoryObject[category]) app.categoryObject[category] = {};
          if (! app.categoryObject[category][subcategory]) app.categoryObject[category][subcategory] = [];
          app.categoryObject[category][subcategory].push(field);
        }
        app.buildCategoryList(app.categoryObject);
        app.buildDropdownControl(app.headers);
      }
    });
  }
  // build category lsit on sidebar
  app.buildCategoryList = function(data){
    var html = '';
    var categories = Object.keys(data);
    for (var i = 0; i < categories.length;i++){
      html += '<div class="collapsebtn-container" onClick=app.expandCategory(this) target="cat'+i+'">'+categories[i]+'<a class="collapsebtn">+</a></div><ul class="fields cat'+i+' hidden">';
      var subcat = data[categories[i]];
      var subcatKeys = Object.keys(subcat);
      for (var j = 0; j < subcatKeys.length;j++){
        var fields = subcat[subcatKeys[j]];
        if (fields.length == 1){
          // html += '<input class="dataField" type="radio" name="field" onclick=app.fromCategory(this) field="'+fields[0]+'">'+app._getFieldLabel(fields[0])+'<br>';
          continue;
        }
        html += '<div class="collapsebtn-container" onClick=app.expandCategory(this) target="cat'+i+'subcat'+j+'"><b>'+subcatKeys[j]+'<a class="collapsebtn">+</a></b></div><ul class="fields cat'+i+'subcat'+j+' hidden">';
        for (var k = 0; k < fields.length;k++){
          html += '<input class="dataField" type="radio" name="field" onclick=app.fromCategory(this) field="'+fields[k]+'">'+app._getFieldLabel(fields[k], true)+'<br>';
          // html += '<li class="dataField" field="'+fields[k]+'" onclick=app.fromCategory(this)>'+app._getFieldLabel(fields[k])+'</li>';
        }
        html += '</ul></div>';
      }
      var noSingle = true;
      var conHtml = '<div class="collapsebtn-container" onClick=app.expandCategory(this) target="cat'+i+'subcatothers"><b>Others<a class="collapsebtn">+</a></b></div><ul class="fields cat'+i+'subcatothers hidden">';
      for (var j = 0; j < subcatKeys.length;j++){
        var fields = subcat[subcatKeys[j]];
        if (fields.length == 1){
          conHtml += '<input class="dataField" type="radio" name="field" onclick=app.fromCategory(this) field="'+fields[0]+'">'+app._getFieldLabel(fields[0])+'<br>';
          noSingle = false
        }
      }
      // console.log(noSingle, !noSingle);
      if (! noSingle) html += conHtml+'</ul></div>';
      html += '</ul></div>';
    }
    $('.category-list').html(html);
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
            layer.on('mouseover', function (e) {
              // this.bindPopup(feature.properties.DISTRICT+'<br>'+app._getFieldLabel($("#dataDropdown").val())
              //             +" : "+this.feature.properties.data);
              // this.openPopup();
              $("#hoverinfotitle .placehodler").addClass('hidden');
              $("#hoverinfodetails .placehodler").addClass('hidden');
              $("#hoverinfotitle .title").removeClass('hidden');
              $("#hoverinfodetails .details").removeClass('hidden');
              $("#hoverinfotitle .title").html(feature.properties.DISTRICT);
              $("#hoverinfodetails .details").html(app._getFieldLabel($("#dataDropdown").val())
                          +" : "+this.feature.properties.data);
            });
            layer.on('mousemove', function (e) {
              // var popup = e.target.getPopup();
              // popup.setLatLng(e.latlng);
            });
            layer.on('mouseout', function (e) {
              // this.closePopup();
              $("#hoverinfotitle .placehodler").removeClass('hidden');
              $("#hoverinfodetails .placehodler").removeClass('hidden');
              $("#hoverinfotitle .title").addClass('hidden');
              $("#hoverinfodetails .details").addClass('hidden');
            });
          }
        }).addTo(app.map);
        app.map.fitBounds(app.layer.getBounds());
        app.readCSV();
      }
    });
  }
  // function to get text based on field NAME
  app._getFieldLabel = function(fieldname, onlyLabel){
    if (onlyLabel) return app.shortLabelObject[fieldname]?app.shortLabelObject[fieldname]:("<i>("+fieldname+")</i>");
    return (app.labelObject[fieldname])?app.labelObject[fieldname]:("<i>("+fieldname+")</i>");
  }

  // build dropdown data control
  app.buildDropdownControl = function (array){
    if(app.dropdown) app.map.removeControl(app.dropdown);
    app.dropdown = L.control({position: 'topright'});
    app.dropdown.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info dropdown');
        var html = '<select id="dataDropdown" onchange="app.dropdownChanged()" style="width:220px">';
        for (var i = app.NAMEINDEX+1; i< array.length; i++){
          var label = app._getFieldLabel(array[i]);
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
  // add a sidebar Control
  app.addSidebarControl = function(){
    if (app.sidebarControl) app.map.removeControl(app.sidebarControl);
    app.sidebarControl = L.control({position: 'topleft'});
    app.sidebarControl.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info sidebarControl');
        var html = "<div onclick=app.showSidebar()>&#9776;</div>";
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.sidebarControl.addTo(app.map);
    $("#gradientDropdown").select2({templateResult: app._styleSelect2});
  }
  // build dropdown data control
  app.buildGradientControl = function (){
    if(app.gradientControl) app.map.removeControl(app.gradientControl);
    app.gradientControl = L.control({position: 'topright'});
    app.gradientControl.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info dropdown');
        var html = '<select id="gradientDropdown" style="width:220px" onchange="app._applyGradient()">';
        for (var i = 0; i< app.COLORS.length; i++){
          html += '<option value = '+i+'>'+app.COLORS[i][0]+'</option>';
        }
        html += '</select>';
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.gradientControl.addTo(app.map);
    $("#gradientDropdown").select2({templateResult: app._styleSelect2});
  }
  // add hover info box
  app.addHoverInfoBox = function(){
    if(app.hoverInfoControl) app.map.removeControl(app.hoverInfoControl);
    app.hoverInfoControl = L.control({position: 'bottomleft'});
    app.hoverInfoControl.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var html = '<div id="hoverinfotitle">';
        html += '<b><span class="placehodler">Hover over a feature</span>';
        html += '<span class="title"></span></b>';
        html += '</div><hr>';
        html += '<div id="hoverinfodetails">';
        html += '<span class="placehodler">Move cursor over a feature in the map to view current Information</span>';
        html += '<span class="details"></span>';
        html += '</div>';
        div.innerHTML = html;
        div.firstChild.onmousedown = div.firstChild.ondblclick = L.DomEvent.stopPropagation;
        return div;
    };
    app.hoverInfoControl.addTo(app.map);
  }
  // style gradient select2
  app._styleSelect2 = function(state){
    if (state.loading) return state;
    var index = parseInt($(state.element).val());
    html = '<div style="width:200px;height:10px;background: linear-gradient(to right, '+app.COLORS[index][1]+' , '+app.COLORS[index][2]+');"></div>'
    return $(html);
  }
  app._applyGradient = function (){
    var gradIndex = $("#gradientDropdown").val();
    var gradient = GradientGenerator.createGradient(app._getGradientColorList(gradIndex));
    app.layer.eachLayer(function(thislayer){
      var data = thislayer.feature.properties.data;
      var ratio = (data - app.minData)/ (app.maxData - app.minData);
      thislayer.setStyle({fillColor:gradient.getColorHexAt(ratio),fillOpacity:"0.8", weight:"1", opacity:1, color:'black'})
    });
    app._updateLegend();
  }
  // get gradient color list
  app._getGradientColorList = function(index){
    return [app.COLORS[index][1],app.COLORS[index][2]]
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
        if (app.dataType != 'str') data = parseFloat(data);
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
    var gradient = GradientGenerator.createGradient(app._getGradientColorList(gradIndex));
    app.legend = L.control({position: 'bottomright'});
    app.legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend');
        var field = $("#dataDropdown").val();
        var label = app._getFieldLabel(field);
        var html = '<h4 class="legend-title" style="margin:5px">Legend</h4>';
        html += '<h5 class="legend-field" style="margin:5px"><i>'+label+'</i></h5>';
        html += '<span class="legend-label">'+app.maxData+'</span>';
        var startColor = app.COLORS[gradIndex][1];
        var endColor = app.COLORS[gradIndex][2];
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
    var catkeys = Object.keys(app.categoryObject);
    var html = ''
    var modalChart = {};
    var modalTable = {};
    for (var i = 0; i<catkeys.length; i++){
      html += '<div class="collapsebtn-container category-head" onClick=app.expandCategory(this) target="modalcat'+i+'">'+catkeys[i]+'<a class="collapsebtn">+</a></div><ul class="fields modalcat'+i+' hidden">';
      var subcat = app.categoryObject[catkeys[i]];
      var subcatKeys = Object.keys(subcat);
      var conHtml = '<div id="modaltable'+i+'"></div>';
      var tabledata = [['Other Indicators', 'Value']];
      var noSingle = true;
      //show graph for values
      for (var j = 0; j < subcatKeys.length;j++){
        var fields = subcat[subcatKeys[j]];
        if (fields.length == 1){
          tabledata.push([app._getFieldLabel(fields[0],true),thisdata[app.headers.indexOf(fields[0])]]);
          noSingle = false;
          continue;
        }
        html += '<div class="modalchart-container" ><b>'+subcatKeys[j]+'</b></div>';
        var graphdata = [['field','value']];
        for (var k = 0; k < fields.length;k++){
          graphdata.push([app._getFieldLabel(fields[k],true),parseFloat(thisdata[app.headers.indexOf(fields[k])])]);
        }
        modalChart['modalchart'+i+j] = graphdata;
        html += '<div class=modalchart id="modalchart'+i+j+'"> </div>';
      }
      if (! noSingle) {
        modalTable['modaltable'+i] = tabledata;
        html += conHtml;
      }
      html += '</ul></div>';
    }
    $('.modal-body').html(html);
    var options = {
      title:'',
      bar: {groupWidth: "55%"},
      legend: { position: "none" },
      vAxis : { textPosition : 'in' }
    };
    var chartIDs = Object.keys(modalChart);
    for (var i = 0; i < chartIDs.length; i++){
      var data = google.visualization.arrayToDataTable(modalChart[chartIDs[i]]);
      var tempoptions = options;
      tempoptions.height = modalChart[chartIDs[i]].length*40;
      var chart = new google.visualization.BarChart(document.getElementById(chartIDs[i]));
      chart.draw(data, tempoptions);
    }
    var tableIDs = Object.keys(modalTable);
    for (var i = 0; i < tableIDs.length; i++){
      var data = google.visualization.arrayToDataTable(modalTable[tableIDs[i]]);
      var tempoptions = options;
      tempoptions.height = modalTable[tableIDs[i]].length*30;
      var chart = new google.visualization.Table(document.getElementById(tableIDs[i]));
      chart.draw(data, options);
    }
    $('#dataModal').modal('show');
  }
  app.expandCategory = function(element){
    var cname = $(element).attr('target');
    var target = $('.'+cname);
    var child = $(element).find('a');
    if (target.hasClass('hidden')){
      target.removeClass('hidden');
      child.html('-');
    }else{
      target.addClass('hidden');
      child.html('+');
    }
  }
  app.fromCategory = function(element){
    var target = $(element).attr('field');
    $('#dataDropdown').val(target).trigger('change');
  }
  app.showSidebar = function(){
    if (app.sidebarControl) app.map.removeControl(app.sidebarControl);
    delete(app.sidebarControl);
    var sidebar = $('#category-container');
    var map = $('#map');
    sidebar.css('margin-left', 0);
    map.css('width','75%');
    setTimeout(function(){app.map.invalidateSize()},1000);
  }
  app.hideSidebar = function(){
    app.addSidebarControl();
    var sidebar = $('#category-container');
    var map = $('#map');
    var width = sidebar.width();
    sidebar.css('margin-left', '-25%');
    map.css('width','100%');
    app.map.invalidateSize();
    setTimeout(function(){app.map.invalidateSize()},1000);
  }
};

// initialize UI
app.initUI = function(){
  app.map = L.map('map').setView([27, 84], 4);
  app.map.attributionControl.addAttribution('Powered by &copy; <a href="http://naxa.com.np/", class="attrib">NAXA</a>');

  app.baseMap = L.tileLayer(app.BASELAYER);
  app.baseMap.addTo(app.map);
  app.buildGradientControl();
  app.addHoverInfoBox();
  // app.addSidebarControl();
};

app.initialize = function(){
  google.charts.load('current', {'packages':['corechart','table']});
  // google.charts.load('current', {'packages':['table']});

  app.createConstants();
  app.createHelpers();

  app.initUI();
  app.loadGeojson();
  // app.readCSV();
};

app.initialize();
