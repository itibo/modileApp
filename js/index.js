var app = {

  // Application Constructor
  initialize: function() {
    // config
    this.site = 'http://209.123.209.168:3000';
//    this.site = 'http://192.168.92.208:3000';
    this.push_id = '';
    this.token = false;
    this.userInfo = {};
    this.coordinates = [];
    // как часто в милисекундах проверять геопозицию
    this.watchPositionTimeout = 60000;
    this.senderIDforPushMsg = 216199045656;

    this.bindEvents();
  },

  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    var self = this;

    document.addEventListener('deviceready', $.proxy(this.onDeviceReady, self), false);
    document.addEventListener('backbutton', $.proxy(this.backButton, self), false);
  },

  // deviceready Event Handler
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    var self = this;

    self.pushRegister();
    self.updatePosition();
    self.route();

    $(document).bind( "pagebeforechange", function( e, data ) {
      if ( typeof data.toPage === "string" ) {
        self.route(data);
        e.preventDefault();
      }
    });
  },

  pushRegister: function(){
    var pushNotification;
    var successHandler = function (result) {};
    var errorHandler = function(error) {};
    try
    {
      pushNotification = window.plugins.pushNotification;

      if (device.platform == 'android' || device.platform == 'Android') {
        pushNotification.register(successHandler, errorHandler,
          {
            "senderID": app.senderIDforPushMsg,
            "ecb":"app.onNotificationGCM"
          }
        );		// required!
      } else {
        pushNotification.register(
          function(result){
            app.push_id = result;
          },
          errorHandler,
          {
            "badge":"true",
            "sound":"true",
            "alert":"true",
            "ecb":"app.onNotificationAPN"
          }
        );	// required!
      }
    }
    catch(err)
    {
      txt="There was an error on this page.\n\n";
      txt+="Error description: " + err.message + "\n\n";
      alert(txt);
    }
  },

  // handle APNS notifications for iOS
  onNotificationAPN: function (e) {
    if (e.alert) {
      navigator.notification.alert(e.alert);
    }
    if (e.sound) {
      /*        var snd = new Media(e.sound);
       snd.play();
       */
    }

    if (e.badge) {
      pushNotification.setApplicationIconBadgeNumber(function(result){}, e.badge);
    }
  },

  // handle GCM notifications for Android
  onNotificationGCM: function(e) {
    switch( e.event )
    {
      case 'registered':
        if ( e.regid.length > 0 )
        {
          app.push_id = e.regid;
        }
        break;

      case 'message':
        if (e.foreground)
        {
          // if the notification contains a soundname, play it.
          /*                var my_media = new Media("/android_asset/www/"+e.soundname);
           my_media.play();
           */
        }
        else
        {	// otherwise we were launched because the user touched a notification in the notification tray.
          if (e.coldstart){
//            $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
          } else {
//            $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
          }
        }
        alert(e.payload.message);
/*
        $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
        $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');*/
        break;

      case 'error':
//        $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
        break;
      default:
//        $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
        break;
    }
  },

  updatePosition: function(){
    var watchID,
        geolocation = navigator.geolocation;

    if (geolocation){
      watchID = geolocation.watchPosition(
        function(position){
          if (watchID != null) {
            if (app.token){
              app.coordinates[app.coordinates.length] = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                time: (new Date()).toUTCString()
              };
            } else {
              app.coordinates[0] = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                time: (new Date()).toUTCString()
              };
            }
          }
        },
        function(PositionError){
          console.log(PositionError.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 30000,
          timeout: app.watchPositionTimeout
        }
      );
    }
  },

  showContent: function(args_array){
    var urlObj, options,
      self = this,
      $container = $('body>div#main');

    urlObj = args_array[0];
    options = (args_array.length > 1) ? args_array[1] : {};

    switch (urlObj.hash){
      case "#login":
        $container.html(new LoginView().render().el).trigger('pagecreate');
        break;
      case "#my_jobs":
        $container.html(new MyJobsView().render().el).trigger('pagecreate');
        break;
      case "#inspections":
        $container.html(new InspectionsView().render().el).trigger('pagecreate');
        break;
      case "#welcome":
      default:
        $container.html(new WelcomeView().render().el).trigger('pagecreate');
        break;
    }
    $container.page();

    options.dataUrl = urlObj.href;
    $.mobile.changePage( $container, options );
    return $container;
  },

  // routing
  route: function(data){
    var u,
        arguments = [],
        self = this;
    data = data || {};

    u = $.mobile.path.parseUrl( ((typeof data == 'object') && (typeof data.toPage == 'string'))?
        data.toPage : window.location.href );

    if (app.token){
       if (u.hash == "#login"){
        u = $.mobile.path.parseUrl(u.hrefNoHash);
       }
    } else {
      u = $.mobile.path.parseUrl(u.hrefNoHash + "#login");
    }

    arguments.push(u);
    if (typeof data.options === "object"){
      arguments.push(data.options);
    }
    self.showContent(arguments);
  },

  //login
  getLoginToken: function(email, password){

    var coordinates = app.coordinates;
    if (app.coordinates.length > 0){
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/login.json',
        data: {
          email: email,
          password: password,
          gps: coordinates,
          device: {
            uuid: device.uuid,
            platform: device.platform
          },
          push_id: app.push_id
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function(data) {
          app.coordinates = app.coordinates.splice(0, coordinates.length);
          app.token = data.token;
          app.userInfo = $.extend(app.userInfo, data.user);
          app.route();
          return false;
        },
        error: function(error){
          (new LoginView().showErrorMessage(error)).trigger('pagecreate');
        }
      });
    }
  },

  //logout
  logout: function(){
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/logout.json',
      data: {id: app.token, lat: app.lat, lon: app.lon},
      cache: false,
      crossDomain: true,
      dataType: 'json',
      success: function(data) {
        app.token = false;
        app.route();
      },
      error: function(error) {
        console.log(error);
      }
    });
  },

  backButton:function(){
    app.showConfirm('exit', 'Quit?', app.exitFromApp);
  },

  exitFromApp: function(buttonIndex){
    if (buttonIndex==2){
      if (app.token!=''){
        app.logOut();
      }
      navigator.app.exitApp();
    }
  }


};
