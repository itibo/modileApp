if (navigator.geolocation){
  navigator.geolocation.getAccurateCurrentPosition = function (geolocationSuccess, geolocationError, geoprogress, options) {

    var lastCheckedPosition,
        locationEventCount = 0,
        watchID,
        timerID;

    options = options || {};

    var checkLocation = function (position) {
      lastCheckedPosition = position;
//alert("position in checkLocation: " + JSON.stringify(position));
      locationEventCount = locationEventCount + 1;
      // We ignore the first event unless it's the only one received because some devices seem to send a cached
      // location even when maxaimumAge is set to zero
      if ((position.coords.accuracy <= options.desiredAccuracy) && (locationEventCount > 1)) {
        clearTimeout(timerID);
        navigator.geolocation.clearWatch(watchID);
        foundPosition(position);
      } else {
        geoprogress(position);
      }
    };

    var stopTrying = function () {
//alert("stopTrying invoked!");
      navigator.geolocation.clearWatch(watchID);
      foundPosition(lastCheckedPosition);
    };

    var onEnableHighAccuracyError = function(error){
//alert("onEnableHighAccuracyError invoked with error: " + JSON.stringify(error));
      if (2 == error.code || 3 == error.code){
        options.enableHighAccuracy = false;
        navigator.geolocation.clearWatch(watchID);
//alert("options: " + JSON.stringify(options));
        watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
//alert("watchID without high accuracy: " + watchID);
      } else {
        onError(error);
      }
    };

    var onError = function (error) {
//alert("onError invoked with error: " + JSON.stringify(error));
      clearTimeout(timerID);
      navigator.geolocation.clearWatch(watchID);
      geolocationError(error);
    };

    var foundPosition = function (position) {
      geolocationSuccess(position);
    };

    if (!options.maxWait)            options.maxWait = 60000; // Default 1 minute
    if (!options.desiredAccuracy)    options.desiredAccuracy = 50; // Default 50 meters
    if (!options.timeout)            options.timeout = options.maxWait / 2; // Default to maxWait

    options.maximumAge = 0; // Force current locations only
    options.enableHighAccuracy = false; // Force high accuracy (otherwise, why are you using this function?)

    watchID = navigator.geolocation.watchPosition(checkLocation, onEnableHighAccuracyError, options);
//	watchID = navigator.geolocation.watchPosition(checkLocation, onError, options);
    timerID = setTimeout(stopTrying, options.maxWait + 1000); // Set a timeout that will abandon the location loop
  };
}