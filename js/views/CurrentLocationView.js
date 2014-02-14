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

Handlebars.registerHelper('GPSInfo', function(){
  var out = "";
  out = "GPS Info section";
  return new Handlebars.SafeString(out);
});

CurrentLocationView.template = Handlebars.compile($("#current-location-tpl").html());