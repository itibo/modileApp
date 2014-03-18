var app = {

  // Application Constructor
  initialize: function() {
    // config
    this.site = 'http://209.123.209.169:3000';  // ALPHA
//    this.site = 'http://209.123.209.154/';      // BETA
    this.watchID = null;
    this.coordinates = [];

    // как часто в милисекундах проверять геопозицию
    this.watchPositionTimeout = 300000;
    this.senderIDforPushMsg = "324530090267";
    this.current_page = "";
    this.check_interval_flag = void 0;
    this.collect_gps_interval_flag = void 0;
    this.autoconnect_flag = false;
    this.application_version = "0.4.5";
    this.application_build = "ALPHA";

    // allow to submit inspection
    this.allowToSubmit = true;
    // allow to send check
    this.allowToCheck = true;
    // last location object
    this.lastLocation = {};

    // nearest locations options
    this.nearestLocDist = 20; // in miles
    this.nearestLocDuration = function(){
      return (/^Area Supervisor/ig).test(this.getUserInfo().role) ? 7 : 14
    };

    this.watch_position_ID = void 0;

    /* begin: process execution flag */
    this.process_execution_flag = function(){
      var flag = false,
          changeTime;

      return {
        checkBusy: function(){
          if (changeTime && ((Date.now()) - changeTime)/1000 > 600 ){
            changeTime = flag = false;
          }
          return flag;
        },
        setFlag: function(state){
          if (state){
            changeTime = Date.now();
            flag = true;
          } else {
            changeTime = flag = false;
          }
        }
      }
    };

    this.sync_process_execution_flag = this.process_execution_flag();

    /* end: process execution flag */

    /* start: nearest locations filter */
    this.nearestLocationsFilter = function(data){
      var out = void 0;
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("nearestLocationsFilter", data);
          out = data;
        } else {
          window.localStorage.removeItem("nearestLocationsFilter");
          out = {};
        }
      } else {
        out = window.localStorage.getItem("nearestLocationsFilter") ? window.localStorage.getItem("nearestLocationsFilter") : (void 0);
      }
      return out;
    };
    /* end: nearest locations filter */

    /* start: my sites filter */

    this.sitesFilters = function(data){
      var out = void 0;
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("sitesFilters", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("sitesFilters");
          out = {};
        }
      } else {
        out = window.localStorage.getItem("sitesFilters") ? JSON.parse(window.localStorage.getItem("sitesFilters")) : {};
      }
      return out;
    };

    /* end: my sites filter */

    /* ------------------------- */
    // suppllier main page helper
    this.supplierMainPageHelper = function(data){
      var out = {};
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("supplierMainPageHelper", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("supplierMainPageHelper");
          out = {};
        }
      } else {
        out = window.localStorage.getItem("supplierMainPageHelper") ? JSON.parse(window.localStorage.getItem("supplierMainPageHelper")) : {};
      }
      return out;
    };

    // sites filter
    this.siteFilter = function(data){
      var out = void 0,
          helper = app.supplierMainPageHelper();
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          out = helper.site_id = data;
          app.supplierMainPageHelper(helper);
        } else {
          out = helper.site_id = void 0;
          app.supplierMainPageHelper(helper);
        }
      } else {
        out = helper.site_id;
      }
      return out;
    };

    // active tab
    this.activeTab = function(data){
      var out = void 0,
          helper = app.supplierMainPageHelper();
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          out = helper.active_tab = data;
          app.supplierMainPageHelper(helper);
        } else {
          out = helper.active_tab = "drafts";
          app.supplierMainPageHelper(helper);
        }
      } else {
        out = helper.active_tab || "drafts";
      }
      return out;
    };

    // my_sites
    this.mySites = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("mySites", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("mySites");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("mySites") ? JSON.parse(window.localStorage.getItem("mySites")) : [];
      }
      return out;
    };

    // sitesStaffingInfo
    this.sitesStaffingInfo = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("sitesStaffingInfo", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("sitesStaffingInfo");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("sitesStaffingInfo") ? JSON.parse(window.localStorage.getItem("sitesStaffingInfo")) : [];
      }
      return out;
    };

    //supply_orders_template
    this.supplyOrdersTemplate = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("supplyOrdersTemplate", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("supplyOrdersTemplate");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("supplyOrdersTemplate") ? JSON.parse(window.localStorage.getItem("supplyOrdersTemplate")) : [];
      }
      return out;
    };

    // orders drafts
    this.mySupplyOrdersDrafts = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("mySupplyOrdersDrafts", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("mySupplyOrdersDrafts");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("mySupplyOrdersDrafts") ? JSON.parse(window.localStorage.getItem("mySupplyOrdersDrafts")) : [];
      }
      return out;
    }

    // future orders
    this.myFutureOrders = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("myFutureOrders", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("myFutureOrders");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("myFutureOrders") ? JSON.parse(window.localStorage.getItem("myFutureOrders")) : [];
      }
      return out;
    }

    // last submitted orders
    this.myLastSubmittedOrders = function(data){
      var out = [];
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("myLastSubmittedOrders", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("myLastSubmittedOrders");
          out = [];
        }
      } else {
        out = window.localStorage.getItem("myLastSubmittedOrders") ? JSON.parse(window.localStorage.getItem("myLastSubmittedOrders")) : [];
      }
      return out;
    }

    // current active order
    this.activeOrder = function(data){
      var out = {};
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("activeOrder", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("activeOrder");
          out = {};
        }
      } else {
        out = window.localStorage.getItem("activeOrder") ? JSON.parse(window.localStorage.getItem("activeOrder")) : {};
      }
      return out;
    }

    // last sync date
    this.last_sync_date = function(data){
      var out = null;
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("last_sync_date", data);
          out = data;
        } else {
          window.localStorage.removeItem("last_sync_date");
          out = null;
        }
      } else {
        out = window.localStorage.getItem("last_sync_date") ? window.localStorage.getItem("last_sync_date") : null;
      }
      return out;
    }

    // ids mutations object
    this.ids_mutation = function(data){
      var out = {};
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("ids_mutation", JSON.stringify(data));
          out = data;
        } else {
          window.localStorage.removeItem("ids_mutation");
          out = {};
        }
      } else {
        out = window.localStorage.getItem("ids_mutation") ? JSON.parse(window.localStorage.getItem("ids_mutation")) : {};
      }
      return out;
    }


    /* ------------------------- */

    this.online_flag = function(){
      return !(navigator.connection.type == navigator.connection.NONE || navigator.connection.type == navigator.connection.UNKNOWN);
    };

    this.cancell_inspection = function(data){
      if (typeof data != "undefined"){
        window.localStorage.setItem("cancellInspection", JSON.stringify(data));
        return;
      } else {
        return window.localStorage.getItem("cancellInspection") ? JSON.parse(window.localStorage.getItem("cancellInspection")) : false;
      }
    };

    this.getCheckStatus = function(){
      if (app.autoconnect_flag) {
        return 1;
      } else if (app.cancell_inspection()){
        return 2;
      } else if ( $.inArray(app.getJobInspectionContainer().status, ["pending", "pre_submitting"]) > -1 ){
        return 3;
      } else {
        return 0;
      }
    };

    // сайты, доступные к инспекции
    this.sitesToInspect = function(){
      return window.localStorage.getItem("sitesToInspect") ? JSON.parse(window.localStorage.getItem("sitesToInspect")) : [];
    };

    this.setSitesToInspect = function(data, i){
      if (typeof i != "undefined"){
        var savetSitesToInspect = app.sitesToInspect();
        if ( "last" == i ){
          data = savetSitesToInspect.push(data);
        } else {
          savetSitesToInspect[i] = data;
          data = savetSitesToInspect;
        }
      }
      window.localStorage.setItem("sitesToInspect", JSON.stringify(data));
      return;
    };

    this.token = function(){
      return window.localStorage.getItem("token") ? window.localStorage.getItem("token") : false;
    };

    this.setToken = function(new_value){
      var self = this;
      if (new_value){
        window.localStorage.setItem("token", new_value);
      } else {
        window.localStorage.removeItem("token");
        self.setUserInfo(false);
      }
      return;
    };

    this.savedCheckList = function(data){
      if (typeof data != "undefined"){
        data = data || false;
        if (data) {
          window.localStorage.setItem("savedCheckList", JSON.stringify(data));
        } else {
          window.localStorage.removeItem("savedCheckList");
        }
        return;
      } else {
        return window.localStorage.getItem("savedCheckList") ? JSON.parse(window.localStorage.getItem("savedCheckList")) : {};
      }
    }

    this.setJobInspectionContainer = function(data){
      var data = data || false;
      var new_val;
      var job_container = {
        id: null,
        job_id: null,
        site_id: null,
        status: "",
        started_at: false,
        completed_at: false,
        container: []
      };

      if (data.id){
        new_val = $.extend(job_container, data);
      } else {
        new_val = job_container;
        app.savedCheckList(false);
      }
      window.localStorage.setItem("jobInspection", JSON.stringify(new_val));
      return new_val;
    };

    this.getJobInspectionContainer = function(){
      var job_container = {
        id: null,
        job_id: null,
        site_id: null,
        status: "",
        started_at: false,
        completed_at: false,
        container: []
      };
      return window.localStorage.getItem("jobInspection") ? JSON.parse(window.localStorage.getItem("jobInspection")) : job_container;
    };

    this.setUserInfo = function(obj){
      if (obj){
        window.localStorage.setItem("userInfo", JSON.stringify(obj));
      } else {
        window.localStorage.removeItem("userInfo");
      }
    };

    this.getUserInfo = function(){
      return window.localStorage.getItem("userInfo") ? JSON.parse(window.localStorage.getItem("userInfo")) : {};
    };

    this.setPushID = function(push_id){
      if (push_id){
        window.localStorage.setItem("push_id", push_id);
      } else {
        window.localStorage.removeItem("push_id");
      }
      return;
    };

    this.getPushID = function(){
      return window.localStorage.getItem("push_id") ? window.localStorage.getItem("push_id") : false;
    };

    this.bindEvents();
  },

  // Bind Event Listeners
  //
  // Bind any events that are required on startup. Common events are:
  // 'load', 'deviceready', 'offline', and 'online'.
  bindEvents: function() {
    var self = this;
    document.addEventListener('deviceready', $.proxy(this.onDeviceReady, self), false);
    document.addEventListener("online", $.proxy(this.onOnline, self), false);
    document.addEventListener("offline", $.proxy(this.onOffline, self), false);
  },

  // deviceready Event Handler
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    var self = this;
    document.addEventListener('backbutton', $.proxy(this.backButton, self), false);
    document.addEventListener('menubutton', $.proxy(this.menuButton, self), false);

    if (!self.getPushID()){
      self.pushRegister();
    }

    if(self.token()){
      self.autoconnect_flag = true;
//      self.updatePosition();
//      self.check();
      self.startCheckInterval();
    }

    app.sync_process_execution_flag.setFlag(false);

    self.route();

    $(document).bind( "pagebeforechange", function( e, data ) {
      $("#menu").hide();
      if ( typeof data.toPage === "string" ) {
        self.route(data);
        e.preventDefault();
      }
    });

    $(document).on('click', '#menu a.logout', function(event){
      event.preventDefault();
      navigator.notification.confirm(
          ((app.getJobInspectionContainer().id != null) ?
              "There is an unsubmitted inspection. You will lose this data if continue. Are you still want to log out?" :
              "Are you sure you want to log out?"),
          function(buttonIndex){
            if(2 == buttonIndex){
              self.logout.call(self);
            }
          },
          "Log out",
          'Cancel,Confirm'
      );
    });
  },

  pushRegister: function(){
    var pushNotification;
    var successHandler = function (result) {};
    var errorHandler = function(error) {};
    try
    {
      pushNotification = window.plugins.pushNotification;

      if ((/android/ig).test(device.platform)) {
        pushNotification.register(successHandler, errorHandler,
          {
            "senderID": app.senderIDforPushMsg,
            "ecb":"app.onNotificationGCM"
          }
        );
      } else {
        pushNotification.register(
          function(result){
            app.setPushID(result);
          },
          errorHandler,
          {
            "badge":"true",
            "sound":"true",
            "alert":"true",
            "ecb":"app.onNotificationAPN"
          }
        );
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
          app.setPushID(e.regid);
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

  checkTic: function() {
//    console.log("checkTic invoked!");
//    alert("checkTic invoked!");
/*    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
          function(position){
            if (app.token()){
              var job_inspect_container = app.getJobInspectionContainer();
              if ("submitting" == job_inspect_container.status &&
                  ("undefined" == typeof job_inspect_container.submitting_position || job_inspect_container.submitting_position.length == 0) )
              {
                job_inspect_container = app.setJobInspectionContainer($.extend(job_inspect_container,
                    {
                      submitting_position: [{
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        acc: position.coords.accuracy,
                        time: (job_inspect_container.completed_at) ? job_inspect_container.completed_at : (new Date()).toUTCString(),
                        timestamp: position.timestamp,
                        application_status: app.getCheckStatus(),
                        site_id: (job_inspect_container.site_id)? (job_inspect_container.site_id) : null,
                        job_id: (job_inspect_container.job_id)? (job_inspect_container.job_id) : null
                      }]
                    }
                ));
              }
              if (!$.isEmptyObject(app.lastLocation)) {
                var R = 6371; // km
                var dLat = (position.coords.latitude - app.lastLocation.lat).toRad();
                var dLon = (position.coords.longitude - app.lastLocation.lng).toRad();
                var lat1 = app.lastLocation.lat.toRad();
                var lat2 = position.coords.latitude.toRad();
                var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c;
                if (d > 0.05){
                  app.coordinates.push({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    acc: position.coords.accuracy,
                    time: (new Date()).toUTCString(),
                    timestamp: position.timestamp,
                    application_status: app.getCheckStatus(),
                    site_id: (job_inspect_container.site_id && "submitting" != job_inspect_container.status)? (job_inspect_container.site_id) : null,
                    job_id: (job_inspect_container.job_id && "submitting" != job_inspect_container.status)? (job_inspect_container.job_id) : null
                  });
                }
              } else {
                app.coordinates.push({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  acc: position.coords.accuracy,
                  time: (new Date()).toUTCString(),
                  timestamp: position.timestamp,
                  application_status: app.getCheckStatus(),
                  site_id: (job_inspect_container.site_id && "submitting" != job_inspect_container.status)? (job_inspect_container.site_id) : null,
                  job_id: (job_inspect_container.job_id && "submitting" != job_inspect_container.status)? (job_inspect_container.job_id) : null
                });
              }
              app.check();
            } else {
              app.coordinates = [{
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                acc: position.coords.accuracy,
                time: (new Date()).toUTCString(),
                timestamp: position.timestamp,
                application_status: app.getCheckStatus()
              }];
            }
            app.lastLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              acc: position.coords.accuracy,
              timestamp: position.timestamp
            };
            app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
          },
          function(error){
            app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
            //do nothing
          },
          { maximumAge: 0, timeout: 60000, enableHighAccuracy: false }
      );
    }*/
    if (app.coordinates.length > 0){
      app.check();
    } else {
      app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
    }
    app.sync();
  },

  collectGeoPositions: function(){
    if (navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
          function(position){
            if (app.token()){
              var job_inspect_container = app.getJobInspectionContainer();
              if ("submitting" == job_inspect_container.status &&
                  ("undefined" == typeof job_inspect_container.submitting_position || job_inspect_container.submitting_position.length == 0) )
              {
                job_inspect_container = app.setJobInspectionContainer($.extend(job_inspect_container,
                    {
                      submitting_position: [{
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        acc: position.coords.accuracy,
                        time: (job_inspect_container.completed_at) ? job_inspect_container.completed_at : (new Date()).toUTCString(),
                        timestamp: position.timestamp,
                        application_status: app.getCheckStatus(),
                        site_id: (job_inspect_container.site_id)? (job_inspect_container.site_id) : null,
                        job_id: (job_inspect_container.job_id)? (job_inspect_container.job_id) : null
                      }]
                    }
                ));
              }

//              if (!$.isEmptyObject(app.lastLocation)) {
              if (app.coordinates.length > 0 ) {
                var R = 6371; // km
                var dLat = (position.coords.latitude - app.coordinates[app.coordinates.length - 1].lat).toRad();
                var dLon = (position.coords.longitude - app.coordinates[app.coordinates.length - 1].lng).toRad();
                var lat1 = app.coordinates[app.coordinates.length - 1].lat.toRad();
                var lat2 = position.coords.latitude.toRad();
                var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
                var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                var d = R * c;
                if (d > 0.03){
                  app.coordinates.push({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    acc: position.coords.accuracy,
                    time: (new Date()).toUTCString(),
                    timestamp: position.timestamp,
                    application_status: app.getCheckStatus(),
                    site_id: (job_inspect_container.site_id && "submitting" != job_inspect_container.status)? (job_inspect_container.site_id) : null,
                    job_id: (job_inspect_container.job_id && "submitting" != job_inspect_container.status)? (job_inspect_container.job_id) : null
                  });
                }
              } else {
                app.coordinates.push({
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  acc: position.coords.accuracy,
                  time: (new Date()).toUTCString(),
                  timestamp: position.timestamp,
                  application_status: app.getCheckStatus(),
                  site_id: (job_inspect_container.site_id && "submitting" != job_inspect_container.status)? (job_inspect_container.site_id) : null,
                  job_id: (job_inspect_container.job_id && "submitting" != job_inspect_container.status)? (job_inspect_container.job_id) : null
                });
              }
            } else {
              app.coordinates = [{
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                acc: position.coords.accuracy,
                time: (new Date()).toUTCString(),
                timestamp: position.timestamp,
                application_status: app.getCheckStatus()
              }];
            }
            app.lastLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              acc: position.coords.accuracy,
              timestamp: position.timestamp
            };
          },
          function(error){
            //do nothing
          },
          { maximumAge: 0, timeout: 60000, enableHighAccuracy: false }
      );
    }
    setTimeout(app.collectGeoPositions, 60000);
  },

  stopCheckInterval: function(){
    clearTimeout(app.check_interval_flag);
    app.check_interval_flag = void 0;
    clearTimeout(app.collect_gps_interval_flag);
    app.collect_gps_interval_flag = void 0;
    navigator.geolocation.clearWatch(app.watch_position_ID);
    app.watch_position_ID = void 0;
  },

  startCheckInterval: function(){
//    alert("startCheckInterval invoked!");
//    clearTimeout(app.check_interval_flag);
    if(app.token() && undefined === app.check_interval_flag){
      setTimeout(function(){
        if (app.autoconnect_flag)
          app.check();
        app.sync();
      }, 1000);
      app.collect_gps_interval_flag = setTimeout(app.collectGeoPositions, 60000);
      app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
      navigator.geolocation.clearWatch(app.watch_position_ID);
      app.watch_position_ID = void 0;
      app.watch_position_ID = navigator.geolocation.watchPosition(function(){}, function(){}, {maximumAge: 0, enableHighAccuracy: true});
    }
  },

  sync: function(){
//    alert("sync invoked !" );
    // return if sync process is already
    if (app.sync_process_execution_flag.checkBusy()){
      return ;
    }

    var _time_to_remember='';
    var formatSupplyOrders = function(object){
      var tmp_obj = {};
      $.each(Object.keys(object), function(obj_key_ind, obj_key_val){
        if ($.inArray(typeof object[obj_key_val], ["string", "number", "boolean"])>-1){
          tmp_obj[obj_key_val] = object[obj_key_val];
        } else {
          tmp_obj[obj_key_val] = {};
        }
      });
      $.each(object.supply_order_categories, function(category_ind, category_val){
        tmp_obj['supply_order_categories'][category_val.category] = {};
        $.each(category_val.supply_order_detail, function(item_ind, item_val){
          tmp_obj['supply_order_categories'][category_val.category][item_val.item_id] = item_val;
        });
      });
      return tmp_obj;
    },
        standardize_id = function(obj){
          var mutations = app.ids_mutation(),
              tmp = $.extend(true, {}, obj);
          if (undefined === mutations[obj.supply_order_id]){
            return tmp
          } else {
            return (function(){
              tmp.id = tmp.supply_order_id = mutations[obj.supply_order_id];
              if (undefined !== tmp.locally_saved){
                tmp.locally_saved.id = tmp.locally_saved.supply_order_id = mutations[obj.supply_order_id];
              }
              return tmp;
            })();
          }
    };
    var sync_process = function(position_obj, methods_to_chain, method_when_update_sync_time){
      app.sync_process_execution_flag.setFlag(true);
      position_obj = position_obj || false;
      methods_to_chain = methods_to_chain || [];
      method_when_update_sync_time = method_when_update_sync_time || '';

//      alert("sync fired with parems methods_to_chain: " + JSON.stringify(methods_to_chain) + "; method_when_update_sync_time: " + method_when_update_sync_time + "; _time_to_remember: " + _time_to_remember);
      // ["sites", "draft_order", "submitted_order", "supply_order_details", "sync_check", "update_drafts", "submit_to_vendor", "save_orders"]
      var methods_to_chain_mapping = {
        sites: "my_sites",
        draft_order: "my_draft_orders",
        future_order: "my_future_orders",
        submitted_order: "my_last_submitted_orders",
        supply_order_details: "supply_order_details",
        sync_check: "sync_check",
        update_drafts: "save_orders",
        submit_to_vendor: "save_orders",
        save_orders: "save_orders",
        props: "sites_properties",
        sites_properties: "sites_properties",
        site_properties: "sites_properties",
        site_schedule: "sites_schedule"
      },
          orders_ready_to_sync = function(){
            return ($.grep($.merge($.merge([], app.mySupplyOrdersDrafts()), app.myFutureOrders()), function(n,i){
              return ( (undefined != n.submit_status && "submitting" == n.submit_status && undefined == n.submitting) ||
                  (undefined != n.locally_saved && !$.isEmptyObject(n.locally_saved) && undefined == n.sending) ||
                  (undefined != n.to_remove && undefined == n.removing) );
            }).length>0);
          };
      var allow_to_chain_methods = true;
      var dfrrd = $.Deferred();
      dfrrd.resolve();


      var DeferredAjax = function(func){
        this.deferred = $.Deferred();
        this.url = app.site+'/mobile/'+func+'.json';
        this.func = func;
        this.data = (function(method){
          var tmp = $.extend({},{
            id: app.token,
            version: app.application_version,
            last_sync_at: app.last_sync_date(),
            gps: (position_obj) ? [position_obj] : null
          });
          switch (method) {
            case 'save_orders':
              var to_update = (function(){
                var updated = [],
                    submitted = [],
                    delete_drafts = [],
                    updated_future = [],
                    delete_future = [],
                    mySupplyOrdersDrafts = app.mySupplyOrdersDrafts(),
                    myFutureOrders = app.myFutureOrders();

                app.mySupplyOrdersDrafts( (function(){
                  $.each(mySupplyOrdersDrafts, function(i,draft){
                    if (undefined != draft.locally_saved && !$.isEmptyObject(draft.locally_saved) && undefined == draft.sending){
                      if (($.grep(updated, function(n,i){return n.supply_order_id == String(draft.locally_saved.supply_order_id)})).length < 1){
                        updated.push(draft.locally_saved);
                        mySupplyOrdersDrafts[i]["sending"] = true;
                      }
                    }
                    if (undefined != draft.submit_status && "submitting" == draft.submit_status && undefined == draft.submitting){
                      if (($.grep(submitted, function(n,i){return n.supply_order_id == String(draft.supply_order_id)})).length < 1){
                        submitted.push({supply_order_id: draft.supply_order_id});
                        mySupplyOrdersDrafts[i]["submitting"] = true;
                      }
                    }
                    if(undefined != draft.to_remove && undefined == draft.removing) {
                      if (($.grep(delete_drafts, function(n,i){return n.supply_order_id == String(draft.supply_order_id)})).length < 1){
                        delete_drafts.push({supply_order_id: draft.supply_order_id});
                        mySupplyOrdersDrafts[i]["removing"] = true;
                      }
                    }
                  });
                  return mySupplyOrdersDrafts;
                })() );

                app.myFutureOrders((function(){
                  $.each(myFutureOrders, function(i,future){
                    if (undefined != future.locally_saved && !$.isEmptyObject(future.locally_saved) && undefined == future.sending){
                      if (($.grep(updated_future, function(n,ind){return n.supply_order_id == String(future.locally_saved.supply_order_id)})).length < 1){
                        updated_future.push(future.locally_saved);
                        myFutureOrders[i]["sending"] = true;
                      }
                    }

                    if(undefined != future.to_remove && undefined == future.removing) {
                      if (($.grep(delete_future, function(n,ind){return n.supply_order_id == String(future.supply_order_id)})).length < 1){
                        delete_future.push({supply_order_id: future.supply_order_id});
                        myFutureOrders[i]["removing"] = true;
                      }
                    }
                  });
                  return myFutureOrders;
                })());

                return {
                  updated_drafts: updated.reverse(),
                  submit_drafts: submitted.reverse(),
                  delete_drafts: delete_drafts.reverse(),
                  updated_future: updated_future.reverse(),
                  delete_future: delete_future.reverse()
                };
              })();

              tmp = $.extend(tmp, to_update);
              break;
            default:
              break;
          }
          return tmp;
        })(func);
      };

      DeferredAjax.prototype.promise = function() {
        return this.deferred.promise();
      };

      DeferredAjax.prototype.decline = function(){
        var self = this;

        switch (self.func) {
          case "save_orders":
            var mySupplyOrdersDrafts = app.mySupplyOrdersDrafts(),
                myFutureOrders = app.myFutureOrders();
            app.mySupplyOrdersDrafts((function(){
              $.each(mySupplyOrdersDrafts, function(i,v){
                mySupplyOrdersDrafts[i]["sending"] = void 0;
                mySupplyOrdersDrafts[i]["submitting"] = void 0;
                mySupplyOrdersDrafts[i]["removing"] = void 0;
              });
              return mySupplyOrdersDrafts;
            })());
            app.myFutureOrders((function(){
              $.each(myFutureOrders, function(i,v){
                myFutureOrders[i]["sending"] = void 0;
                myFutureOrders[i]["removing"] = void 0;
              });
              return myFutureOrders;
            })());
            break;
          default:
            break;
        }

        self.deferred.reject();
      };

      DeferredAjax.prototype.invoke = function(){
        var self = this;
        $.ajax({
          type: "POST",
          url: self.url,
          data: self.data,
          cache: false,
          crossDomain: true,
          dataType: 'json',
          global: false,
          timeout: 30000,
          success: function(data){

            switch (self.func) {
              case "sync_check":
                if (data.sync_list.length > 0){
                  var methods_to_chain_result = [];
                  $.each(data.sync_list, function(i,f){
                    if (undefined !== methods_to_chain_mapping[f])
                      methods_to_chain_result.push(methods_to_chain_mapping[f]);
                  });
                  _time_to_remember = data.time;
                  setTimeout(function(){
                    sync_process(position_obj, methods_to_chain_result, methods_to_chain_result[methods_to_chain_result.length-1]);
                  }, 0);
                } else {
                  app.sync_process_execution_flag.setFlag(false);
                }
                break;
              case "save_orders":
                app.ids_mutation((function(old_obj){
                  var tmp = {};
                  $.each(data.mutations, function(i,v){
                    if (i != v){
                      tmp[i] = v;
                    }
                  });
                  return $.extend(old_obj, tmp);
                })(app.ids_mutation()));

                break;
              case "my_sites":
                app.mySites(data.sites);
                break;
              case "sites_properties":
                app.mySites((function(){
                  var mySites = app.mySites();
                  if (mySites.length == 0) {
                    mySites = data.properties;
                  } else {
                    $.each(data.properties, function(i,prop){
                      $.each(mySites, function(ix,site_in_LS){
                        if (prop.site_id === site_in_LS.site_id){
//alert("site_in_LS: " + JSON.stringify(site_in_LS) + "\r\n" + "propertie from server: " + JSON.stringify(prop));
                          mySites[ix] = $.extend(true, site_in_LS, prop);
//alert("result site: " + JSON.stringify(mySites[ix]));
                          return false;
                        }
                      });
                    });
                  }
                  return mySites;
                })());
                break;
              case "sites_schedule":
                app.sitesStaffingInfo(data.sites_schedule);
                break;
              case "my_draft_orders":
              case "my_future_orders":
                var result_items = [],
                    mutations = app.ids_mutation(),
                    local_storage_method = ("my_draft_orders" === self.func)? "mySupplyOrdersDrafts": "myFutureOrders",
                    local_items = app[local_storage_method](),
                    remote_items = data.supply_orders_list;

                // заполняем оредеры пришедшими с сервера
                try{
                  if (local_items.length === 0) {
                    $.each(remote_items, function(i,remote_order){
                      result_items.push($.extend(true, {}, formatSupplyOrders(remote_order)));
                    });
                  } else {
                    // проверяем на наличие новых изменений в ордерах, которые уже синхронизизированы ранее
                    $.each(remote_items, function(ir,remote_order){
                      $.each(local_items, function(il,local_order){
                        if ($.inArray(String(remote_order.supply_order_id),
                            $.merge([String(local_order.supply_order_id)],
                                undefined === mutations[local_order.supply_order_id]
                                    ? []
                                    : [String(mutations[local_order.supply_order_id])]
                            )) > -1
                            ){
                          if ( (new Date(remote_order.updated_at_utc)) < (new Date(local_order.updated_at_utc)) ){
                            var _tmp = $.extend(true, {}, standardize_id(local_order));

                            if (_tmp["sending"]){
                              _tmp["sending"] = void 0;
                            }
                            if (_tmp["submitting"]){
                              _tmp["submitting"] = void 0;
                            }
                            if (_tmp["removing"]){
                              _tmp["removing"] = void 0;
                            }
                            result_items.push(_tmp);

                          } else {
                            result_items.push($.extend(true, {}, formatSupplyOrders(remote_order)));
                          }
                          return false;
                        }
                      });
                    });
                  }
                } catch (er){
                  $.each(remote_items, function(i,remote_order){
                    result_items.push($.extend(true, {}, formatSupplyOrders(remote_order)));
                  });
                }

//alert(result_items.length + " ордера с сервера: " + JSON.stringify(result_items));
                // проверяем ПОЯВИЛИСЬ ЛИ НОВЫЕ ордера/фьючеры на девайсе пока идет процесс синхронизации до их перезаписи
                $.each(local_items, function(ir, local_order){
                  var resulted_orders = $.merge([], result_items);
                  if ( $.grep(resulted_orders, function(resulted, ind){
                    return ( /^new_on_device_/.test(local_order.supply_order_id)
                        && undefined === mutations[local_order.supply_order_id]
                        && String(resulted.supply_order_id) == String(local_order.supply_order_id) )
                  }).length > 0 )
                  {
                    alert("прошел проверку этот ордер:" + JSON.stringify(local_order));
                    result_items.push(local_order);
                  }
                });
//alert(result_items.length + " ордера после проверки на появление новых: " + JSON.stringify(result_items));

                app[local_storage_method](result_items);
                break;
              case "my_last_submitted_orders":
                var tmp = [];
                $.each(data.supply_orders_list, function(i,v){
                  tmp.push(formatSupplyOrders(v));
                });
                app.myLastSubmittedOrders(tmp);
                break;
              case "supply_order_details":
                app.supplyOrdersTemplate(data.order_details);
                break;
              default:
                break;
            }

            if (method_when_update_sync_time == self.func && "" != _time_to_remember){
              app.last_sync_date(_time_to_remember);
              app.sync_process_execution_flag.setFlag(false);
            }

            self.deferred.resolve();
          },
          error: function(err){
            app.sync_process_execution_flag.setFlag(false);
            self.decline();

            if (err.status == 401){
              app.logout();
            }
          }
        });

        return self.deferred.promise();
      };

      if (orders_ready_to_sync()){
        methods_to_chain.push('save_orders');
      }
      if ("" == method_when_update_sync_time){
        methods_to_chain.push('sync_check');
      }

      (function(methods){
        $.each(methods, function(ix, def_func) {
          dfrrd = dfrrd.then(function(){
            return (function(method){
              var da = new DeferredAjax(method);
              $.when( app.check_online(true) ).then(
                  function(){
                    da.invoke();
                  },
                  function(){
                    da.decline();
                    app.sync_process_execution_flag.setFlag(false);
                    allow_to_chain_methods = false;
                  }
              );
              return da.promise();
            })(def_func);
          });
        });
      })(methods_to_chain);
    };

    navigator.geolocation.getCurrentPosition(function(position){
      sync_process({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        time: (new Date()).toUTCString(),
        timestamp: position.timestamp
      });
    }, function(error){
      sync_process();
    }, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
  },

  //TODO: refactor, refactor and refactor again
  check: function(use_geofence, callback){
//    console.log("check invoked!");
//    alert("check invoked with use_geofence: " + use_geofence);
    use_geofence = use_geofence || false;
    var token = app.token();

    var tryToSubmitInspection = function(position){
      position = position || false;
      var inspection_container = app.getJobInspectionContainer();
      var pos = (inspection_container.submitting_position) ? inspection_container.submitting_position : position;

      if (app.allowToSubmit && "submitting" == inspection_container.status && pos){
        app.submitInspection(function(){}, function(error){}, pos);
      }
    };

    if (token){
      if (app.online_flag()){
        var ajax_call = function(coord, success, error){
          $.ajax({
            type: "POST",
            url: app.site+'/mobile/check.json',
            data: {
              id: token,
              use_geofence: use_geofence,
              version: app.application_version,
              all_jobs: (typeof callback == "function")? true : false,
              gps: coord
            },
            cache: false,
            crossDomain: true,
            dataType: 'json',
            global: (typeof callback == "function")? true : false,
            timeout: 60000,
            beforeSend: function(xhr, options){
              if (!use_geofence){
                if (!app.allowToCheck){
                  xhr.abort();
                  return false;
                }
                app.allowToCheck = false;
              }
            },
            success: function(data) {
              app.autoconnect_flag = false;
              app.cancell_inspection(false);

              if (success && "function" == typeof success){
                success(data, function(){
                  if (!use_geofence)
                    app.allowToCheck = true;
                });
              }
              tryToSubmitInspection(coord);

//              (new WelcomeView()).updateContent();

              if(typeof callback == "function"){
                callback();
              }
            },
            error: function(e){

              if (!use_geofence)
                app.allowToCheck = true;

              if (e.status == 401){
                navigator.notification.alert(
                    "Invalid authentication token. You need to log in before continuing.", // message
                    function(){
                      app.setToken(false);
                      app.route();
                    },    // callback
                    "Authentication failed",       // title
                    'Ok'         // buttonName
                );
              } else{
                if (error && "function" == typeof error){
                  error();
                }
              }
            }
          });
        };
        if ( use_geofence ){
          $.when( app.get_position(), app.check_online() ).done(function(obj1, obj2 ){

            ajax_call(obj1.position,
                function(data, clb){
                  app.setSitesToInspect(data.jobs);
                  if ("function" == typeof clb && clb){
                    clb();
                  }
                },
                function(){
                  app.route();
                }
            );
          }).fail(function(obj){
            app.internet_gps_error(obj);
            if ($("#overlay").is(':visible')){
              $("#overlay").hide();
            }
          });
        } else {
          var coordinates = app.coordinates,
              insp_cont = app.getJobInspectionContainer(),
              inspection_status = app.getCheckStatus();

          if (coordinates.length > 0){
            ajax_call(coordinates,
                function(data, clb){
                  app.coordinates = (app.coordinates).slice(coordinates.length);

                  var savedSitesToInspect = app.sitesToInspect();
                  $.each(data.jobs, function(ind,v){
                    var new_site = true;
                    for(var i=0; i < savedSitesToInspect.length; i++) {
                      if(v.site_id == savedSitesToInspect[i].site_id && v.job_id == savedSitesToInspect[i].job_id){
                        new_site = false;
                        if (v.last_inspection != savedSitesToInspect[i].last_inspection){
                          app.setSitesToInspect(v, i);
                        }
                        break;
                      }
                    }
                    if (new_site){
                      app.setSitesToInspect(v, "last");
                    }
                  });
                  if ("function" == typeof clb && clb){
                    clb();
                  }
                },
                function(){}
            );
          } else if ( 0 == coordinates.length && (1 == inspection_status || "submitting" == insp_cont.status)) {
//          alert("coordinates empty, insp_status: " + inspection_status + " cont_stattus: " + insp_cont.status);
            navigator.geolocation.getCurrentPosition(
                function(position){
                  app.lastLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    acc: position.coords.accuracy,
                    timestamp: position.timestamp
                  };
                  var gps = [{
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                    acc: position.coords.accuracy,
                    time: (new Date()).toUTCString(),
                    application_status: inspection_status
                  }];
                  ajax_call(gps,
                      function(data, clb){
                        var savedSitesToInspect = app.sitesToInspect();
                        $.each(data.jobs, function(ind,v){
                          var new_site = true;
                          for(var i=0; i < savedSitesToInspect.length; i++) {
                            if(v.site_id == savedSitesToInspect[i].site_id && v.job_id == savedSitesToInspect[i].job_id){
                              new_site = false;
                              if (v.last_inspection != savedSitesToInspect[i].last_inspection){
                                app.setSitesToInspect(v, i);
                              }
                              break;
                            }
                          }
                          if (new_site){
                            app.setSitesToInspect(v, "last");
                          }
                        });
                        if ("function" == typeof clb && clb){
                          clb();
                        }
                      },
                      function(){}
                  );
                },
                function(error){
                  // do nothing
                },
                {timeout:30000, maximumAge: 0, enableHighAccuracy: false}
            );
          }
        }
      } else if (typeof callback == "function" && !app.online_flag()) {
        app.internet_gps_error();
      }
    } else {
      app.route();
    }
  },

  get_position: function(){
    return $.Deferred(function($deferred){
      var job_inspect_container = app.getJobInspectionContainer();

      if ($("#overlay").is(':hidden')){
        $("#overlay").show();
      }

      if (navigator.geolocation){
        navigator.geolocation.getCurrentPosition(
            function(position){
              var inspection_status = app.getCheckStatus();

              app.lastLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                acc: position.coords.accuracy,
                timestamp: position.timestamp
              };
              $deferred.resolve({
                status: 'success',
                position: [{
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  acc: position.coords.accuracy,
                  time: (new Date()).toUTCString(),
                  timestamp: position.timestamp,
                  application_status: inspection_status,
                  site_id: (3 == inspection_status && job_inspect_container.site_id)? (job_inspect_container.site_id) : null,
                  job_id: (3 == inspection_status && job_inspect_container.job_id)? (job_inspect_container.job_id) : null
                }]
              });
            },
            function(error){
              $deferred.reject({
                status: 'error',
                type: 'gps',
                error: error
              });
            },
            { maximumAge: 0, timeout: 60000, enableHighAccuracy: false }
        );
      } else {
        $deferred.reject({
          status: 'error',
          type: 'gps',
          error: {
            message: "Your browser doesn't support geolocation!"
          }
        });
      }

    }).promise();
  },

  check_online: function(silent){
    silent = silent || false;
    return $.Deferred(function($deferred){
      if (!silent && $("#overlay").is(':hidden')){
        $("#overlay").show();
      }
      if (app.online_flag()){
        $deferred.resolve({
          status: 'success'
        });
      } else {
        $deferred.reject({
          status: 'error',
          type: 'internet',
          error: {
            code: 4,
            message: "There is Internet connection problem. Please try again later"
          }
        });
      }
    }).promise();
  },

  getInspectionsLog: function(success_callback){
    var self = this;
    var ajax_call = function(){
      var token = app.token();
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/inspections_log.json',
        data: {
          id: token
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            if (typeof success_callback == "function"){
              success_callback(data.log);
            }
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });
    };

    $.when( app.check_online() ).done(function(obj){
      ajax_call.call(self);
    }).fail(function(obj){
        app.internet_gps_error(obj);
      if ($("#overlay").is(':visible')){
        $("#overlay").hide();
      }
    });
  },

  collectLSDataAndSendToServer: function(dump_to_extend, callback){
    var token = app.token(),
        ret_LS_json = {},
        dump_to_extend = dump_to_extend || {};

    $.extend(true, ret_LS_json, dump_to_extend, {
      token: app.token(),
      lastLocation: app.lastLocation,
      sync_process_execution_flag: app.sync_process_execution_flag.checkBusy(),
      last_sync_date: app.last_sync_date(),
      ids_mutation: app.ids_mutation(),
      jobInspectionContainer: {
        allowToSubmit: app.allowToSubmit,
        jobInspectionContainer: app.getJobInspectionContainer()
      },
      activeOrder: app.activeOrder(),
      mySupplyOrdersDrafts: app.mySupplyOrdersDrafts(),
      myFutureOrders: app.myFutureOrders(),
      myLastSubmittedOrders: app.myLastSubmittedOrders(),
      mySites: app.mySites(),
      supplyOrdersTemplate: app.supplyOrdersTemplate()
    });

    $.when( app.check_online() ).done(function(obj1){
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/dump_mobile_data.json',
        data: {
          id: token,
          version: app.application_version,
          data: ret_LS_json
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            if ("function" == typeof callback) {
              callback();
            }
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });
    }).fail(function(obj){
      var err_callbacks = {
        1: {
          name: "Cancel",
          action: function(){
            // do nothind
          }
        },
        2: {
          name: "Back to Main Page",
          action: function(){
            app.route();
          }
        }
      };
      app.internet_gps_error(obj, err_callbacks);
      if ($("#overlay").is(':visible')){
        $("#overlay").hide();
      }
      $("#menu").hide();
    });
  },

  mySupplyOrders: function(success_callback){
    var self = this;
    var formatSupplyOrders = function(object){
      var tmp_obj = {};
      $.each(Object.keys(object), function(obj_key_ind, obj_key_val){
        if ($.inArray(typeof object[obj_key_val], ["string", "number", "boolean"])>-1){
          tmp_obj[obj_key_val] = object[obj_key_val];
        } else {
          tmp_obj[obj_key_val] = {};
        }
      });
      $.each(object.supply_order_categories, function(category_ind, category_val){
        tmp_obj['supply_order_categories'][category_val.category] = {};
        $.each(category_val.supply_order_detail, function(item_ind, item_val){
          tmp_obj['supply_order_categories'][category_val.category][item_val.item_id] = item_val;
        });
      });
      return tmp_obj;
    };
    var ajax_call = function(pos){

      var token = app.token();

      var my_supply_orders_request = $.ajax({
        type: "POST",
        url: app.site+'/mobile/my_draft_orders.json',
        data: {
          id: token,
          version: app.application_version,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            var tmp = [];
            $.each(data.supply_orders_list, function(i,v){
              tmp.push(formatSupplyOrders(v));
            });
            app.mySupplyOrdersDrafts(tmp);
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });

      var my_last_submitted_orders = $.ajax({
        type: "POST",
        url: app.site+'/mobile/my_last_submitted_orders.json',
        data: {
          id: token,
          version: app.application_version,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            var tmp = [];
            $.each(data.supply_orders_list, function(i,v){
              tmp.push(formatSupplyOrders(v));
            });
            app.myLastSubmittedOrders(tmp);
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });

      var chained = my_supply_orders_request.then(function() {
        return my_last_submitted_orders;
      });

      chained.done(function() {
        if (typeof success_callback == "function"){
          success_callback();
        }
      });
    };

    if (app.last_sync_date()){
      success_callback();
    } else {
      $.when( app.check_online() ).done(function(obj1){
        navigator.geolocation.getCurrentPosition(function(position){
          ajax_call.call(self, [{
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy,
            time: (new Date()).toUTCString(),
            timestamp: position.timestamp
          }]);
        }, function(error){
          ajax_call.call(self, null);
        }, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
      }).fail(function(obj){
        app.internet_gps_error(obj);
        if ($("#overlay").is(':visible')){
          $("#overlay").hide();
        }
      });
    }
  },

  getSitesOrdersList: function(success_callback){
    var self = this;
    var ajax_call = function(pos){
      var token = app.token();
      var my_sites_request = $.ajax({
        type: "POST",
        url: app.site+'/mobile/my_sites.json',
        data: {
          id: token,
          version: app.application_version,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            app.mySites(data.sites);
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });
      var my_supply_order_template_request = $.ajax({
        type: "POST",
        url: app.site+'/mobile/supply_order_details.json',
        data: {
          id: token,
          version: app.application_version,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            app.supplyOrdersTemplate(data.order_details);
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });

      var chained = my_sites_request.then(function() {
        return my_supply_order_template_request;
      });

      chained.done(function() {
        if (typeof success_callback == "function"){
          success_callback();
        }
      });
    };

    if ( app.last_sync_date() ){
      success_callback();
    } else {
      $.when( app.check_online() ).done(function(obj1){
        navigator.geolocation.getCurrentPosition(function(position){
          ajax_call.call(self, [{
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy,
            time: (new Date()).toUTCString(),
            timestamp: position.timestamp
          }]);
        }, function(error){
          ajax_call.call(self, null);
        }, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
      }).fail(function(obj){
        app.internet_gps_error(obj);
        if ($("#overlay").is(':visible')){
          $("#overlay").hide();
        }
      });
    }
  },

  getSiteInfo: function(site_id, back_to_page, success_callback){
    var self = this,
        ajax_call = function(pos){
      var token = app.token();
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/sites_schedule.json',
        data: {
          id: token,
          last_sync_at: "",
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            if (typeof success_callback == "function"){
              success_callback(get_full_site_info(site_id, data.sites_schedule, back_to_page));
            }
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });
    },
        get_full_site_info = function(site_id, staffing_container, back_to_page){
          var ret = {},
              back_to_page = back_to_page || "siteslist";

          if ("my_jobs" != back_to_page ) {
            $.each(app.mySites(), function(i,v){
              if (site_id == v.site_id) {
                ret = $.extend(true, ret, {common_info: v} );
                return false;
              }
            });
            $.each(staffing_container, function(i,v){
              if (site_id == v.site_id) {
                ret = $.extend(true, ret, {staffing_plan: v} );
                return false;
              }
            });
            if (back_to_page){
              ret = $.extend(true, ret, {back_to_page: "#" + back_to_page} );
            }
          } else {
            $.each(staffing_container, function(i,v){
              if (site_id == v.site_id) {
                ret = $.extend(true, ret, {common_info: v} );
                ret.common_info.site_schedule = void 0;
                ret = $.extend(true, ret, {staffing_plan: {site_data: v.site_schedule}}, {back_to_page: "#my_jobs"} );
                return false;
              }
            });
          }
          return ret;
        };

    if(back_to_page && "my_jobs" == back_to_page){
      success_callback(get_full_site_info(site_id, app.sitesToInspect(), back_to_page));
    } else if ( app.last_sync_date() ){
      success_callback(get_full_site_info(site_id, app.sitesStaffingInfo(), back_to_page));
    } else {
      $.when( app.check_online() ).done(function(obj1){
        navigator.geolocation.getCurrentPosition(function(position){
          ajax_call.call(self, [{
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy,
            time: (new Date()).toUTCString(),
            timestamp: position.timestamp
          }]);
        }, function(error){
          ajax_call.call(self, null);
        }, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
      }).fail(function(obj){
        app.internet_gps_error(obj);
        if ($("#overlay").is(':visible')){
          $("#overlay").hide();
        }
      });
    }
  },

  getSitesList: function(success_callback){
    var self = this;
    var ajax_call = function(pos){
      var token = app.token();
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/my_sites.json',
        data: {
          id: token,
          version: app.application_version,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            if (typeof success_callback == "function"){
              app.mySites(data.sites);
              success_callback(data.sites);
            }
          } else {
            app.setToken(false);
            app.route();
          }
          return false;
        },
        error: function(error){
          app.errorAlert(error, "Error", function(){
            if (error.status == 401){
              navigator.notification.alert(
                  "Invalid authentication token. You need to log in before continuing.", // message
                  function(){
                    app.setToken(false);
                    app.route();
                  },    // callback
                  "Authentication failed",       // title
                  'Ok'         // buttonName
              );
            } else {
              app.errorAlert(error, "Error", function(){
                app.route();
              });
            }
          });
        }
      });
    };

    if ( app.last_sync_date() ){
      success_callback(app.mySites());
    } else {
      $.when( app.check_online() ).done(function(obj1){
        navigator.geolocation.getCurrentPosition(function(position){
          ajax_call.call(self, [{
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            acc: position.coords.accuracy,
            time: (new Date()).toUTCString(),
            timestamp: position.timestamp
          }]);
        }, function(error){
          ajax_call.call(self, null);
        }, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
      }).fail(function(obj){
        app.internet_gps_error(obj);
        if ($("#overlay").is(':visible')){
          $("#overlay").hide();
        }
      });

    }
  },

  showContent: function(args_array){
    var urlObj, options,
      self = this,
      $container = $('body>div#main');

    urlObj = args_array[0];
    options = (args_array.length > 1) ? args_array[1] : {};

    switch (true) {
      case '#login' == urlObj.hash:
        $container.html(new LoginView().render().el).trigger('pagecreate');
        break;
      case '#my_jobs' == urlObj.hash:
        app.check(true, function(){
          $container.html(new MyJobsView().render().el).trigger('pagecreate');
        });
        break;
      case '#siteslist' == urlObj.hash:
        app.getSitesList(function(list){
          $container.html(new SitesListView(list).render().el).trigger('pagecreate');
        });
        break;
      case /^#siteinfo:(.+)$/.test(urlObj.hash):
        var site_id = urlObj.hash.match(/^#siteinfo:(\d+)/)[1],
//            use_check_callback_to_get_info = /^#siteinfo:(\d+)-check$/.test(urlObj.hash) ? true : false;
            back_to_page = /^#siteinfo:(\d+)-(\w+)$/.test(urlObj.hash)
                ? ( urlObj.hash.match(/^#siteinfo:(\d+)-(\w+)$/)[2] || "" )
                : false;
//        app.getSiteInfo(site_id, use_check_callback_to_get_info, function(site_info){
       app.getSiteInfo(site_id, back_to_page, function(site_info){
          $container.html(new SiteInfoView(site_info).render().el).trigger('pagecreate');
        });
        break;
      case /^#inspection:(\d+)\-(\d+)$/.test(urlObj.hash):
        var identification_array = (urlObj.hash.match(/\d+\-\d+$/)[0]).split("-");
        app.getCheckList(identification_array, function(){
          var savedCheckList = app.savedCheckList();
          app.setJobInspectionContainer($.extend(app.getJobInspectionContainer(), {checklist_id: savedCheckList.checklist_id} ));
          $container.html(new InspectionView(savedCheckList.list).render().el).trigger('pagecreate');
        });
        break;
      case '#orders' == urlObj.hash:
          app.mySupplyOrders(function(){
            $container.html(new SupplierView().render().el).trigger('pagecreate');
          });
        break;
      case /^#order:(.+)$/.test(urlObj.hash):
        var order_id = urlObj.hash.match(/^#order:(.+)$/)[1] || "new";
        //alert("order_id on route: " + order_id);
        app.getSitesOrdersList(function(){
          $container.html(new OrderView(order_id).render().el).trigger('pagecreate');
          (function(){$("div", $container).first().trigger('orderevent');})();});
        break;
      case /^#order-overall:(.+)$/.test(urlObj.hash):
        var order = urlObj.hash.match(/^#order-overall:(.+)$/)[1] || "active_order";
        $container.html(new OrderOverallView(order).render().el).trigger('pagecreate');
        break;
      case '#inspectionslog' == urlObj.hash:
        app.getInspectionsLog(function(list){
          $container.html(new InspectionsLogView(list).render().el).trigger('pagecreate');
        });
        break;
      case '#gps_info' == urlObj.hash:
        $container.html(new CurrentLocationView().render().el).trigger('pagecreate');
        break;
      case '#send_dump' == urlObj.hash:
        $container.html(new ProblemReportView().render().el).trigger('pagecreate');
        break;
      case '#nearest_locations' == urlObj.hash:
        $container.html(new NearestLocationsView().render().el).trigger('pagecreate');
        break;
      case '#welcome' == urlObj.hash:
      default:
        $container.html(new WelcomeView().render().el).trigger('pagecreate');
        break;
    }
    window.scrollTo(0,0);
    return this;
  },

  // routing
  route: function(data){
    var u,
        arguments = [],
        self = this;
    data = data || {};
    u = $.mobile.path.parseUrl( ((typeof data == 'object') && (typeof data.toPage == 'string'))?
        data.toPage : window.location.href );

    if (app.token()){
      if (u.hash == "#login"){
        u = $.mobile.path.parseUrl(u.hrefNoHash);
      }
      var job_insp_cont = app.getJobInspectionContainer();
      if (job_insp_cont.site_id && job_insp_cont.status == "pending" ){
        u = $.mobile.path.parseUrl(u.hrefNoHash + "#inspection:" + job_insp_cont.site_id + "-" + job_insp_cont.job_id);
      }
      if ( (/^#order[:]?(.+)$/.test(u.hash) || /^(edit|add)OrderItem:(.*)$/i.test(u.hash) ) &&
          !(/^Area Supervisor/i.test(app.getUserInfo().role)) ){
        u = $.mobile.path.parseUrl(u.hrefNoHash);
      }

    } else {
      app.LS_clean();
      u = $.mobile.path.parseUrl(u.hrefNoHash + "#login");
    }
    app.current_page = u.hash;
    arguments.push(u);
    if (typeof data.options === "object"){
      arguments.push(data.options);
    }
    self.showContent(arguments);
  },

  //get inspection check list of the current job
  getCheckList: function(identification_array, success_callback){
    identification_array = identification_array || [];
    var self = this,
      inspect_job_cont = app.getJobInspectionContainer(),
      ajax_call = function(){
        var token = app.token();
        $.when( app.check_online(), app.get_position() ).done(function(obj1, obj2 ){
          $.ajax({
            type: "POST",
            url: app.site+'/mobile/show_checklist.json',
            data: {
              id: token,
              job_id: inspect_job_cont.job_id,
              site_id: inspect_job_cont.site_id,
              gps: obj2.position
            },
            cache: false,
            crossDomain: true,
            dataType: 'json',
            timeout: 60000,
            success: function(data) {
              if (data.token == token){
                inspect_job_cont = app.setJobInspectionContainer($.extend(inspect_job_cont, {status: "pending"}));
                app.savedCheckList({checklist_id: data.checklist_id, list: data.list});
                if (typeof success_callback == "function"){
                  success_callback();
                }
              } else {
                app.setToken(false);
                app.route();
              }
              return false;
            },
            error: function(error){
              app.errorAlert(error, "Error", function(){
                if (error.status == 401){
                  app.setToken(false);
                  app.route();
                } else {
                  app.route({toPage: window.location.href + "#my_jobs"});
                }
              });
            }
          });
        }).fail(function(err_obj){
          app.internet_gps_error(err_obj);
          if ($("#overlay").is(':visible')){
            $("#overlay").hide();
          }
        });
      };

    if (inspect_job_cont.status == "submitting" ){
      navigator.notification.alert(
          "There is an unsubmitted inspection. Please, wait until submission will finish and try again.",
          function(){
            app.route({
              toPage: window.location.href + "#my_jobs"
            });
          },
          "Error inspection starting",
          'Ok'
      );
    } else {
      if (inspect_job_cont.site_id != identification_array[0] || inspect_job_cont.job_id != identification_array[1] ||
          $.isEmptyObject(app.savedCheckList()))
      {
        inspect_job_cont = app.setJobInspectionContainer(false);
        inspect_job_cont = app.setJobInspectionContainer($.extend( app.getJobInspectionContainer(),
          {
            id: identification_array[0],
            site_id: identification_array[0],
            job_id: identification_array[1],
            started_at: (new Date()).toUTCString()
          }
        ));
        ajax_call.call(self);
      } else {
        success_callback();
      }
    }
  },

  // submit inspection to server
  submitInspection: function(success_clb, error_clb, position){
    var submit_data = app.getJobInspectionContainer();
    var token = app.token();

    var job_fields = (function(){
      return {job_id: submit_data.job_id, site_id: submit_data.site_id};
    })();

    var get_position_arr = function(pos){
      var arr = [];
      if ($.isArray(pos)){
        arr = pos;
      } else {
        arr = [$.extend({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: pos.coords.accuracy,
          time: (new Date()).toUTCString()
        }, job_fields)];
      }
      return arr;
    };

    if (typeof position != "undefined"){

      $.when( app.check_online() ).done(function(obj1){
		$("#overlay").hide();
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/update_checklist.json',
          data: {
            id: token,
            job_id: job_fields.job_id,
            site_id: job_fields.site_id,
            started_at: submit_data.started_at,
            completed_at: submit_data.completed_at ? submit_data.completed_at : (new Date()).toUTCString(),
            gps: get_position_arr(position),
            checklist_id: submit_data.checklist_id ? submit_data.checklist_id : "",
            checklist_results: submit_data.container ? submit_data.container : [],
            comment: submit_data.comment

          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          timeout: 60000,
          global: false,
          beforeSend: function(xhr, options){
            if (false == app.allowToSubmit){
              xhr.abort();
              return false;
            }
            app.allowToSubmit = false;
          },
          success: function() {
            app.setJobInspectionContainer(false);
            app.allowToSubmit = true;
            if (success_clb && typeof success_clb == "function"){
              success_clb();
            }
          },
          error: function(error){
            app.allowToSubmit = true;
            if (error_clb && typeof error_clb == "function"){
              error_clb(error);
            }
          }
        });
      }).fail(function(){
        $("#overlay").hide();
      });
    }
  },

  //login
  getLoginToken: function(email, password){
    var success_getting_position = function(pos){
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/login.json',
        data: {
          email: email,
          password: password,
          gps: pos,
          device: {
            uuid: device.uuid,
            platform: device.platform
          },
          push_id: app.getPushID(),
          version: app.application_version
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        success: function(data) {
          app.LS_clean();
          app.setToken(data.token);
          app.setUserInfo(data.user);
          app.cancell_inspection(false);
          app.setJobInspectionContainer(false);
//          app.updatePosition();
          app.startCheckInterval();
          app.route();
          return false;
        },
        error: function(error){
          app.errorAlert(error, 426 == error.status ? "Application Must Be Updated" :"Error", function(){} );
        }
      });
    };

    $.when( app.check_online(), app.get_position() ).done(function(obj1, obj2 ){
      success_getting_position(obj2.position);
    }).fail(function(err_obj){
      var msg = (function(){
        var message = "";
        if (4 == err_obj.error.code){
          message = "Sorry, login failed to reach the Inspection server. Please check your network connection or try again later.";
        } else {
          message = "Unable to determine your location. To continue you need to have at least 'Use wireless networks' option enabled in GPS settings.";
          if (2 != err_obj.error.code){
            message = message + " (" + err_obj.error.message + ")";
          }
        }
        return message;
      })();
      navigator.notification.alert(
          msg, //message
          function(){},    // callback
          (4 == err_obj.error.code) ? "Login Failed" : "Unable to determine your location", // title
          'Ok'         // buttonName
      );
      $("#overlay").hide();
    });
  },


  // clean Local Storage
  LS_clean: function(callback){
    app.stopCheckInterval();
    app.setToken(false);
    app.setPushID(false);
    app.setUserInfo(false);
    app.coordinates = [];
    app.setSitesToInspect([]);
    app.setJobInspectionContainer(false);
    app.autoconnect_flag = false;
    app.cancell_inspection(false);
    app.mySites(false);
    app.supplyOrdersTemplate(false);
    app.mySupplyOrdersDrafts(false);
    app.myLastSubmittedOrders(false);
    app.myFutureOrders(false);
    app.activeOrder(false);
    app.sitesStaffingInfo(false);
    app.last_sync_date(false);
    app.ids_mutation(false);
    app.supplierMainPageHelper(false);
    app.nearestLocationsFilter(false);
    app.sitesFilters(false);

//    savedCheckList ?

    if (typeof callback == "function"){
      callback();
    }
  },

  //logout
  logout: function(){
    $.when( app.check_online(), app.get_position() ).done(function(obj1, obj2 ){
      $.ajax({
        type: "POST",
        url: app.site+'/mobile/logout.json',
        data: {
          id: app.token(),
          gps: obj2.position
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000
      });
    }).always(function(){
      app.LS_clean(function(){
        $("#overlay").hide();
        if ($("#menu").is(":visible")){
          $("#menu").toggle();
        }

        app.route();
      });
    });
  },

  menuButton: function() {
    switch (true) {
      case '#welcome' == app.current_page:
      case '' == app.current_page:
      case '#' == app.current_page:
        $("#menu").toggle();
        break;
      default:
        break;
    }
  },

  backButton: function(){
    if ($("#menu").is(":visible")){
      $("#menu").toggle();
    } else if($(".pop_up").css('visibility') == 'visible'){
      $(".pop_up").css("visibility", "hidden");
      $(".popup-overlay").remove();
    } else {
      switch (true) {
        case /^#inspection:(\d+)\-(\d+)$/.test(app.current_page):
          navigator.notification.confirm("Do you want to cancel this inspection?",
              function(buttonIndex){
                if(2 == buttonIndex){
                  app.cancell_inspection(true);
                  app.setJobInspectionContainer(false);
                  app.route({
                    toPage: window.location.href + "#my_jobs"
                  });
                }
              },
              "Inspection cancelling",
              'No,Yes'
          );
          break;
        case /^#siteinfo:(.+)$/.test(app.current_page):
          var back_to;
          try{
            back_to = $("input[type=hidden][id=back_to_page]").val() || "#siteslist"
          } catch(er){
            back_to = "";
          }
          app.route({
            toPage: window.location.href + back_to
          });
          break;
        case /^#order:(.+)$/.test(app.current_page):

          var activeOrder = app.activeOrder(),
              cancelProcess = function (){
                app.activeOrder(false);
                app.route({
                  toPage: window.location.href + "#orders"
                });
                window.scrollTo(0,0);
              },
              isObjectsEqual = function(o1,o2,cfg,reverse){
                cfg = cfg || {};
                cfg.exclude = cfg.exclude || {};
                //first we check the reference. we don't care if null== undefined
                if( cfg.strictMode ){
                  if( o1 === o2 ) return true;
                }
                else{
                  if( o1 == o2 ) return true;
                }
                if( typeof o1 == "number" || typeof o1 == "string" || typeof o1 == "boolean" || !o1 ||
                    typeof o2 == "number" || typeof o2 == "string" || typeof o2 == "boolean" || !o2 ){
                  return false;
                }
                if( ((o1 instanceof Array) && !(o2 instanceof Array)) ||
                    ((o2 instanceof Array) && !(o1 instanceof Array))) return false;

                for( var p in o1 ){
                  if( cfg.exclude[p] || !o1.hasOwnProperty(p) ) continue;
                  if( !isObjectsEqual.call(self,o1[p],o2[p], cfg ) ) return false;
                }
                if( !reverse && !cfg.noReverse ){
                  reverse = true;
                  return isObjectsEqual.call(self,o2,o1,cfg,reverse);
                }
                return true;
              };

          if (isObjectsEqual(activeOrder.proto, activeOrder.upd)){
            cancelProcess();
          } else {
            navigator.notification.confirm(
                "Changes you have entered may not be saved. Do you want to cancel the editing?",
                function(buttonIndex){
                  if(2 == buttonIndex){
                    cancelProcess();
                  }
                },
                "Are you sure?",
                'No,Yes'
            );
          }
          break;

        case /^#order-overall:(.+)$/.test(app.current_page):
          var activeOrder = app.activeOrder(),
              route_to = function(url){
                app.route({
                  toPage: window.location.href + url
                });
              };
          try {
            if (!$.isEmptyObject(activeOrder)){
              route_to("#order:" + activeOrder.upd.supply_order_id);
            } else {
              route_to("#orders");
            }
          } catch(er){
            route_to("#orders");
          }
          break;
        case /^#editOrderItem:(.+)$/.test(app.current_page):
        case /^#addOrderItem:(.+)$/.test(app.current_page):
          app.route({
            toPage: window.location.href + ((app.activeOrder().id) ? "#order:" + app.activeOrder().id : "#orders")
          });
          break;
        case '#nearest_locations' == app.current_page:
          app.route({
            toPage: window.location.href + "#my_jobs"
          });
          break;
        case '#welcome' == app.current_page:
        case '' == app.current_page:
        case '#' == app.current_page:
        case '#login' == app.current_page:
          app.showConfirm('Close', 'Do you want to quit? ',
              function(buttonIndex){
                if(2 == buttonIndex){
                  app.stopCheckInterval();
                  navigator.app.exitApp();
                }
              }
          );
          break;

        default:
          app.route();
          break;
      }
    }
  },

  showConfirm: function(title, question, on_submit_event) {
    navigator.notification.confirm(
        question,
        on_submit_event,
        title,
        'Cancel,OK'
    );
  },

  errorAlert: function(error, title, callback){
    var msg = {};
    try{
      if (error.status == 0){
        msg.message = "Service is temporary unavailable. Please try again later.";
      } else {
        msg = $.parseJSON(error.responseText);
      }
    } catch(e){
      msg.message = error.statusText;
    }

    navigator.notification.alert(
        msg.message, // message
        callback,    // callback
        title,       // title
        'Ok'         // buttonName
    );
  },

  onOnline: function(){
    app.startCheckInterval();
  },

  onOffline: function(){
    app.stopCheckInterval();
  },

  internet_gps_error: function(error, buttons_callback){
    error = error || {};
    buttons_callback = buttons_callback || {
      1: {
        name: "Refresh",
        action: function(){
          app.route({
            toPage: window.location.href + app.current_page
          });
        }
      },
      2: {
        name: "Back to Main Page",
        action: function(){
          app.route();
        }
      }
    };
    var title = ( error.type != "undefined" && 'gps' == error.type) ? 'Unable to determine your location' : 'Internet Connection Problem';
    var msg = (function(e){
      if ($.isEmptyObject(e)){
        return "There is Internet connection problem. Please try again later";
      } else if (e.type != "undefined" && 'gps' == e.type) {
        return "Please check the location options/setting of your device or try again later.";
      } else {
        err = e.error || {};
        if (err.message != "undefined"){
          return err.message;
        } else {
          return "There is Internet connection problem. Please try again later";
        }
      }
    })(error);

    navigator.notification.confirm(
        msg,
        function(buttonIndex){
          if (undefined != buttons_callback[buttonIndex]){
            buttons_callback[buttonIndex]["action"]();
          } else {
            app.route({toPage: window.location.href + "#welcome"})
          }
        },
        title,
        (function(){
          var out = [];
          for(var i in buttons_callback){
            out.push(buttons_callback[i]["name"]);
          }
          return out.join(",");
        })()
    );
  }
};

// for those ajax where global: true
$(document).ajaxStart(function() {
  if ($("#overlay").is(':hidden')){
    $("#overlay").show();
  }
}).ajaxComplete(function() {
  $("#overlay").hide();
});


/** Converts numeric degrees to radians */
if (typeof(Number.prototype.toRad) === "undefined") {
  Number.prototype.toRad = function() {
    return this * Math.PI / 180;
  }
}

if (typeof(Number.prototype.toMiles) === "undefined") {
  Number.prototype.toMiles = function() {
    return (this * 0.621371).toFixed(2);
  }
}