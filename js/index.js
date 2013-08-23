var app = {

  // Application Constructor
  initialize: function() {
    // config
    this.site = 'http://209.123.209.168:3000';
    this.watchID = null;

    this.coordinates = [];
    this.inspectionJobID = false;

    // как часто в милисекундах проверять геопозицию
    this.watchPositionTimeout = 300000;
    this.senderIDforPushMsg = "216199045656";
    // джобы, доступные к инспекции
    this.jobsAvailiableToInspect=[];
    this.current_page = "";
    this.online_flag = true;

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

    this.setJobInspectionContainer = function(data){
      var data = data || false;
      var job_id = data.id || false;
      var job_container = {
        id: null,
        status: "",
        container: []
      };

      if (job_id){
        window.localStorage.setItem("jobInspection", JSON.stringify($.extend(job_container, data)));
      } else {
        window.localStorage.setItem("jobInspection", JSON.stringify(job_container));
      }
      return;
    };

    this.getJobInspectionContainer = function(){
      var job_container = {
        id: null,
        status: "",
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
  },

  // deviceready Event Handler
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    var self = this;

    document.addEventListener('backbutton', $.proxy(this.backButton, self), false);
    document.addEventListener("online", $.proxy(this.onOnline, self), false);
    document.addEventListener("offline", $.proxy(this.onOffline, self), false);


    if (!self.getPushID()){
      self.pushRegister();
    }

    if(self.token()){
      self.updatePosition();

      var inspectionJobID = self.getJobInspectionContainer().id;
      if (inspectionJobID){
        app.inspectionJobID = inspectionJobID;
      }
    }

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

  check: function(use_geofence){
    var use_geofence = use_geofence || false;
    var coordinates = app.coordinates;

    if (app.online_flag && coordinates.length > 0){
      var token = app.token();
      if (token){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/check.json',
          data: {
            id: token,
            use_geofence: use_geofence,
            gps: coordinates
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          global: false,
          success: function(data) {
            app.coordinates = (app.coordinates).slice(coordinates.length)
            $.each(data.jobs, function(ind,v){
              var job_already_exist = false,
                  job_updated = false;
              for(var i=0; i < app.jobsAvailiableToInspect.length; i++) {
                if(v.id == app.jobsAvailiableToInspect[i].id){
                  job_already_exist = true;
                  if (v.last_inspection != app.jobsAvailiableToInspect[i].last_inspection){
                    job_updated = i;
                  }
                  break;
                }
              }
              if (!job_already_exist){
                app.jobsAvailiableToInspect.push(v);
              }else{
                if (job_updated !== false){
                  app.jobsAvailiableToInspect[job_updated] = v;
                }
              }
            });
            (new WelcomeView()).updateContent();
          },
          error: function(error){
            if (error.status == 401){
              app.setToken(false);
              app.route();
            } else{
              // do nothing
            }
          }
        });
      } else {
        app.route();
      }
    }
  },

  updatePosition: function(){
    var geolocation = navigator.geolocation;

    if (geolocation){
      app.watchID = geolocation.watchPosition(
        function(position){
          if (app.watchID != null) {
            if (app.token()){
              app.coordinates.push({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                time: (new Date()).toUTCString()
              });
              app.check();
            } else {
              app.coordinates = [{
                lat: position.coords.latitude,
                lng: position.coords.longitude,
                time: (new Date()).toUTCString()
              }];
            }
          }
        },
        function(PositionError){
          console.log(PositionError.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: app.watchPositionTimeout,
          timeout: app.watchPositionTimeout
        }
      );
    }
  },

  getSitesList: function(success_callback){
    var success_getting_position = function(pos){
      var token = app.token();
      var ajax_call = function(){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/jobs.json',
          data: {
            id: token,
            gps: [{
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: (new Date()).toUTCString()
            }]
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          success: function(data) {
            if (data.token == token){
              if (success_callback){
                success_callback(data.jobs);
              }
            }
            return false;
          },
          error: function(error){
            app.errorAlert(error, "Error", function(){
              if (error.status == 401){
                app.setToken(false);
                app.route();
              } else {
                app.errorAlert(error, "Error", function(){
                  app.route();
                });
              }
            });
          }
        });
      }
      if (app.online_flag){
        ajax_call();
      } else {
        app.connecting_error();
      }
    };
    var error_getting_position = function(error){
      app.errorAlert(error, "Error getting position", function(){} );
    };
    navigator.geolocation.getCurrentPosition(success_getting_position, error_getting_position, {timeout:30000, maximumAge: 0});
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
        $container.html(new MyJobsView().render().el).trigger('pagecreate');
        break;
      case '#siteslist' == urlObj.hash:
        app.getSitesList(function(list){
          $container.html(new SitesListView(list).render().el).trigger('pagecreate');
        });
        break;
      case /^#inspection:(\d+)$/.test(urlObj.hash):
        var job_id = parseInt(urlObj.hash.match(/\d+$/g));
        app.getCheckList(job_id, function(list, checklist_id){
          $container.html(new InspectionView(list, checklist_id).render().el).trigger('pagecreate');
//            $('select', $container).selectbox();
        });
        break;
      case '#welcome' == urlObj.hash:
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

    if (app.token()){
      if (u.hash == "#login"){
        u = $.mobile.path.parseUrl(u.hrefNoHash);
      }
      if (app.inspectionJobID){
        u = $.mobile.path.parseUrl(u.hrefNoHash + "#inspection:" + app.inspectionJobID);
      }
    } else {
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
  getCheckList: function(job_id, success_callback){
    var job_id = job_id || false;
    var success_getting_position = function(pos){
      var token = app.token();
      var ajax_call = function(){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/show_checklist.json',
          data: {
            id: token,
            job: job_id,
            gps: [{
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: (new Date()).toUTCString()
            }]
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          success: function(data) {
            if (data.token == token){
              if (success_callback){
                success_callback(data.list, data.checklist_id);
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
                app.errorAlert(error, "Error", function(){
                  app.route();
                });
              }
            });
          }
        });
      }
      if (app.online_flag){
        app.inspectionJobID = job_id;
        if (app.getJobInspectionContainer().id != job_id){
          app.setJobInspectionContainer({id: job_id, status: "pending"});
        }
        ajax_call();
      } else {
        app.connecting_error("There is internet connection problem.", "Refresh");
      }
    };
    var error_getting_position = function(error){
      app.errorAlert(error, "Error getting position", function(){} );
    };
    navigator.geolocation.getCurrentPosition(success_getting_position, error_getting_position, {timeout:30000, maximumAge: 0});
  },

  // submit inspection to server
  submitInspection: function(submit_data){
    var submit_data = submit_data || [];
    var success_getting_position = function(pos){
      var token = app.token();
      var job_id = app.inspectionJobID;
      var ajax_call = function(){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/update_checklist.json',
          data: {
            id: token,
            job: job_id,
            checklist_id: submit_data.checklist_id ? submit_data.checklist_id : "",
            checklist_results: submit_data.list ? submit_data.list : [],
            comment: submit_data.comment,
            gps: [{
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: (new Date()).toUTCString()
            }]
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          success: function(data) {
            navigator.notification.alert( "Inspection submitted",
              function(){
                app.inspectionJobID = false;
                app.setJobInspectionContainer(false);
                app.route({
                  toPage: window.location.href + "#welcome"
                });
              },
              "Success", 'Ok');
          },
          error: function(error){
            app.errorAlert(error, "Error", function(){
              if (error.status == 401){
                app.setToken(false);
                app.route();
              } else {
                app.errorAlert(error, "Error", function(){
                  app.route();
                });
              }
            });
          }
        });
      }
      if(app.online_flag){
        ajax_call();
      } else {
        app.connecting_error("There is internet connection problem.", "Refresh");
      }
    };
    var error_getting_position = function(error){
      app.errorAlert(error, "Error getting position", function(){} );
    };
    navigator.geolocation.getCurrentPosition(success_getting_position, error_getting_position, {timeout:30000, maximumAge: 0});
  },

  //login
  getLoginToken: function(email, password){
    var success_getting_position = function(pos){
      var ajax_call = function(){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/login.json',
          data: {
            email: email,
            password: password,
            gps: [{
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: (new Date()).toUTCString()
            }],
            device: {
              uuid: device.uuid,
              platform: device.platform
            },
            push_id: app.getPushID()
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          success: function(data) {
            app.setToken(data.token);
            app.setUserInfo($.extend({}, data.user));
            app.updatePosition();
            app.route();
            return false;
          },
          error: function(error){
            app.errorAlert(error, "Error", function(){} );
          }
        });
      }
      if (app.online_flag){
        ajax_call();
      } else {
        app.connecting_error();
      }
    };
    var error_getting_position = function(error){
      app.errorAlert(error, "Error getting position", function(){} );
    };
    navigator.geolocation.getCurrentPosition(success_getting_position, error_getting_position, {timeout:30000, maximumAge: 0});
  },

  //logout
  logout: function(){
    var logout_process = function(){
      navigator.geolocation.clearWatch(app.watchID);
      app.watchID = null;
      app.setToken(false);
      app.coordinates = [];
      app.jobsAvailiableToInspect=[];
      app.route();
    };
    var success_getting_position = function(pos){
      var ajax_call = function(){
        $.ajax({
          type: "POST",
          url: app.site+'/mobile/logout.json',
          data: {
            id: app.token(),
            gps: [{
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              time: (new Date()).toUTCString()
            }]
          },
          cache: false,
          crossDomain: true,
          dataType: 'json',
          success: function(data) {
            logout_process();
          },
          error: function(error) {
          }
        });
      }
      if (app.online_flag){
        ajax_call();
      } else {
        app.connecting_error();
      }
    };
    var error_getting_position = function(err){
      app.errorAlert(error, "Error getting position", function(){} );
    };

    navigator.geolocation.getCurrentPosition(success_getting_position, error_getting_position, {timeout:30000, maximumAge: 0});
  },

  backButton: function(){

    if ($("#popup").length > 0 ){
      $("#popup, .popup-overlay").remove();
    }else{
      switch (true) {
        case /^#inspection:(\d+)$/.test(app.current_page):
          navigator.notification.confirm("Do you want to cancel this inspection?",
              function(buttonIndex){
                if(2 == buttonIndex){
                  app.inspectionJobID = false;
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
        case '#welcome' == app.current_page:
        case '' == app.current_page:
        case '#' == app.current_page:
        case '#login' == app.current_page:
          app.showConfirm('exit', 'Quit?',
              function(buttonIndex){
                if(2 == buttonIndex){
                  navigator.geolocation.clearWatch(app.watchID);
                  app.watchID = null;
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
    if (error.status == 0){
      msg.message = "Service unavailable. Please try later.";
    } else {
      msg = $.parseJSON(error.responseText);
    }

    navigator.notification.alert(
        msg.message, // message
        callback,    // callback
        title,       // title
        'Ok'         // buttonName
    );
  },

  onOnline: function(){
    app.online_flag = true;
  },

  onOffline: function(){
    app.online_flag = false;
  },

  connecting_error: function(msg, buttons){
    var msg = msg || "There is internet connection problem.";
    var buttons = buttons || "Refresh, Back to Main Page";
    navigator.notification.confirm(
        msg,
        function(buttonIndex){
          if (1 == buttonIndex){
            app.route({
              toPage: window.location.href + app.current_page
            });
          } else if (2 == buttonIndex){
            app.route();
          }
        },
        "Internet connection problem",
        buttons
    );
  }

};

// for those ajax where global: true
$(document).ajaxStart(function() {
  $("#overlay").show();
}).ajaxComplete(function() {
  $("#overlay").hide();
});
