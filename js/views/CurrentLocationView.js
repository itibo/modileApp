var CurrentLocationView = function(){

  this.render = function() {
    var self = this,
        context = $.extend(true, {}, {currentLocation: self.currentLocation});
    this.el.html(CurrentLocationView.template(context));
    return this;
  };

  this.updateGPSsection = function(position){
    $(".gps_info .placeholder").remove();
    $(".gps_info").append(
        "Timestamp: " + position.timestamp + "<br />"+
        "Latitude: " + position.coords.latitude + "<br />"+
        "Longitude: " + position.coords.longitude + "<br />"+
        "Accuracy: " + position.coords.accuracy
    );
  };

  this.updateMapsection = function(position){
    $(".gmaps .placeholder").remove();
    $(".gmaps #map_canvas").css("height", $(window).height() - $("div[data-role=header]").height() - $(".gps_info").height() - $(".gmaps>h2").height() );
    var map = new GoogleMap();
    map.initialize();
    $(".gmaps").trigger('pagecreate');
  };

  this.map_initialize = function(){
    alert("map_initialize");
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div/>');

    try {
      if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            function(position){
              self.updateGPSsection(position);
              self.updateMapsection(position);
            },
            function(error){
              self.currentLocation = {};
              self.updateGPSsection({});
              self.updateMapsection({});
            },
            { maximumAge: 0, timeout: 60000, enableHighAccuracy: true }
        );
      } else {
        self.currentLocation = {};
      }
    } catch(er){
      self.currentLocation = {};
    }
  };
  this.initialize();
}

/*Handlebars.registerHelper("GMAPSScript", function(){
  var out = "<script type=\"text/javascript\" src=\"https://maps.googleapis.com/maps/api/js?key=AIzaSyDIRtqdEMzS3mO0OTClg557hCz4WzK415g&sensor=false\"></script>";
  return new Handlebars.SafeString(out);
});*/
CurrentLocationView.template = Handlebars.compile($("#current-location-tpl").html());