var CurrentLocationView = function(){

  this.render = function() {
    var self = this,
        context = $.extend(true, {}, {currentLocation: self.currentLocation});
    this.el.html(CurrentLocationView.template(context));
    return this;
  };

  this.updateGPSSection = function(position){
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
    return this;
  };

  this.updateMapSection = function(position){
    $(".gmaps .placeholder").remove();
    if ($.isEmptyObject(position)){
      $("<div class=\"placeholder\">Geo position is undefined.</div>").insertAfter( ".gmaps h2" );
    } else {
      var map = new GoogleMap();
      map.initialize(position);
    }
    return this;
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div class="curr_loc" />');

    try {
      app.getCurrentPosition(
          function(position){
            self.updateGPSSection(position).updateMapSection(position);
          },
          function(error){
            self.currentLocation = {};
            self.updateGPSSection({}).updateMapSection({});
          },
          { maximumAge: 0, timeout: 60000, enableHighAccuracy: false }
      );
    } catch(er){
      self.currentLocation = {};
    }
  };
  this.initialize();
}

CurrentLocationView.template = Handlebars.compile($("#current-location-tpl").html());