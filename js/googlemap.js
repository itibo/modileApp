function GoogleMap(){

  this.initialize = function(position){
    var position = position || {};
    var map = showMap(position);
  }

  var showMap = function(position){
    try {
      var myLatLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      var mapOptions = {
        zoom: 15,
        center: myLatLng,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      }

      var map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);

      var marker = new google.maps.Marker({
        position: myLatLng,
        title:"You are here!"
      });

      // To add the marker to the map, call setMap();
      marker.setMap(map);


      var circle = new google.maps.Circle({
        center: myLatLng,
        radius: position.coords.accuracy,
        map: map
      });

      //set the zoom level to the circle's size
      map.fitBounds(circle.getBounds());

      return map;
    } catch (er){
      document.getElementById("map_canvas").innerHTML = "Sorry."
    }
  }
}