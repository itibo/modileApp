var CurrentLocationView = function(){

  this.render = function() {
    var self = this,
        context = $.extend(true, {}, {currentLocation: self.currentLocation});
    this.el.html(CurrentLocationView.template(context));
    return this;
  };

  this.updateGPSsection = function(position){
    $(".gps_info .placeholder").remove();
    if ($.isEmptyObject(position)){
      $(".gps_info").append("<div class=\"placeholder\">Geo position is undefined.</div>");
    } else {
      $(".gps_info").append(
          "Timestamp: " + position.timestamp + "<br />"+
              "Latitude: " + position.coords.latitude + "<br />"+
              "Longitude: " + position.coords.longitude + "<br />"+
              "Accuracy: " + position.coords.accuracy
      );
    }
  };

  this.updateMapsection = function(position){
    $(".gmaps .placeholder").remove();
    if ($.isEmptyObject(position)){
      $("<div class=\"placeholder\">Geo position is undefined.</div>").insertAfter( ".gmaps h2" );
      $(".gmaps>div").append();
    } else {
      var map = new GoogleMap();
      map.initialize(position);
      $(".gmaps").trigger('pagecreate');
    }
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div class="curr_loc" />');

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

CurrentLocationView.template = Handlebars.compile($("#current-location-tpl").html());