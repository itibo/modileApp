var app = {

  // Application Constructor
  initialize: function() {
    // config
    this.site = 'http://209.123.209.168:3000';  // ALPHA
//    this.site = 'http://209.123.209.154/';      // BETA
    this.watchID = null;
    this.coordinates = [];

    // как часто в милисекундах проверять геопозицию
    this.watchPositionTimeout = 300000;
    this.senderIDforPushMsg = "216199045656";
    this.current_page = "";
    this.check_interval_flag = void 0;
    this.autoconnect_flag = false;
    this.application_version = "0.3.3";
    this.application_build = "ALPHA";

    // allow to submit inspection
    this.allowToSubmit = true;
    // allow to send check
    this.allowToCheck = true;
    // last location object
    this.lastLocation = {};

    /* ------------------------- */
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

    // last supply sync date
    this.last_supply_sync_date = function(data){
      var out = null;
      if (typeof data != "undefined"){
        data = data || false;
        if (data){
          window.localStorage.setItem("last_supply_sync_date", data);
          out = data;
        } else {
          window.localStorage.removeItem("last_supply_sync_date");
          out = null;
        }
      } else {
        out = window.localStorage.getItem("last_supply_sync_date") ? window.localStorage.getItem("last_supply_sync_date") : null;
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
      return !(navigator.network.connection.type == Connection.NONE);
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
//      self.startCheckInterval();
    }

    self.route();

    $(document).bind( "pagebeforechange", function( e, data ) {
      $("#menu").hide();
      if ( typeof data.toPage === "string" ) {
        self.route(data);
        e.preventDefault();
      }
    });

    $(document).on('click', '#menu a', function(event){
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
                application_status: app.getCheckStatus()
              }];
            }
            app.lastLocation = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              acc: position.coords.accuracy
            };
            app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
          },
          function(error){
            app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
            //do nothing
          },
          { maximumAge: 0, timeout: 60000, enableHighAccuracy: true }
      );
    } else {
      app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
    }
    app.sync_supply();
  },

  stopCheckInterval: function(){
    clearTimeout(app.check_interval_flag);
    app.check_interval_flag = void 0;
  },

  startCheckInterval: function(){
//    clearTimeout(app.check_interval_flag);
    if(app.token() && undefined === app.check_interval_flag){
      setTimeout(function(){
        if (app.autoconnect_flag)
          app.check();
        app.sync_supply();
      }, 1000);
      app.check_interval_flag = setTimeout(app.checkTic, app.watchPositionTimeout);
    }
  },

  sync_supply: function(){
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
    };
    var sync_process = function(position_obj, methods_to_chain, method_when_update_sync_time){
      position_obj = position_obj || false;
      methods_to_chain = methods_to_chain || [];
      method_when_update_sync_time = method_when_update_sync_time || '';

//      alert("sync_supply fired with parems methods_to_chain: " + JSON.stringify(methods_to_chain) + "; method_when_update_sync_time: " + method_when_update_sync_time + "; _time_to_remember: " + _time_to_remember);
      // ["sites", "draft_order", "submitted_order", "supply_order_details", "sync_check", "update_drafts", "submit_to_vendor", "save_orders"]
      var methods_to_chain_mapping = {
        sites: "my_sites",
        draft_order: "my_supply_orders",
        submitted_order: "my_last_submitted_orders",
        supply_order_details: "supply_order_details",
        sync_check: "sync_check",
        update_drafts: "save_orders",
        submit_to_vendor: "save_orders",
        save_orders: "save_orders"
      },
          drafts_ready_to_sync = function(){
            var _tmp = [];
            _tmp = $.grep(app.mySupplyOrdersDrafts(), function(n,i){
              return ( (undefined != n.submit_status && "submitting" == n.submit_status) ||
                  (undefined != n.locally_saved && !$.isEmptyObject(n.locally_saved)) ||
                  (undefined != n.removing) );
            });
            return (_tmp.length>0);
          };
      var allow_to_chain_methods = true;
      var startdeferrpoint = $.Deferred();
          startdeferrpoint.resolve();
      var DeferredAjax = function(func){
        this.deferred = $.Deferred();
        this.url = app.site+'/mobile/'+func+'.json';
        this.func = func;
        this.data = (function(method){
          var tmp = $.extend({},{
            id: app.token,
            version: app.application_version,
            last_sync_at: app.last_supply_sync_date(),
            gps: (position_obj) ? [position_obj] : null
          });
          switch (method) {
            case 'save_orders':
              var to_update = (function(){
                var updated = [],
                    submitted = [],
                    delete_drafts = [];
                    mySupplyOrdersDrafts = app.mySupplyOrdersDrafts();

                app.mySupplyOrdersDrafts( (function(){
                  $.each(mySupplyOrdersDrafts, function(i,draft){
                    if (undefined != draft.locally_saved && !$.isEmptyObject(draft.locally_saved) && undefined == draft.sending){
                      updated.push(draft.locally_saved);
                      mySupplyOrdersDrafts[i]["sending"] = true;
                    }
                    if (undefined != draft.submit_status && "submitting" == draft.submit_status && undefined == draft.submitting){
                      submitted.push({supply_order_id: draft.supply_order_id});
                      mySupplyOrdersDrafts[i]["submitting"] = true;
                    }
                    if(undefined != draft.removing) {
                      delete_drafts.push({supply_order_id: draft.supply_order_id})
                    }
                  });
                  return mySupplyOrdersDrafts;
                })() );

                return {
                  updated_drafts: updated,
                  submit_drafts: submitted,
                  delete_drafts: delete_drafts
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
            var mySupplyOrdersDrafts = app.mySupplyOrdersDrafts();
            app.mySupplyOrdersDrafts((function(){
              $.each(mySupplyOrdersDrafts, function(i,v){
                mySupplyOrdersDrafts[i]["sending"] = void 0;
                mySupplyOrdersDrafts[i]["submitting"] = void 0;
              });
              return mySupplyOrdersDrafts;
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
                  methods_to_chain_result = [];
                  $.each(data.sync_list, function(i,f){
                    methods_to_chain_result.push(methods_to_chain_mapping[f]);
                  });
                  _time_to_remember = data.time;
                  setTimeout(function(){
                    sync_process(position_obj, methods_to_chain_result, methods_to_chain_result[methods_to_chain_result.length-1]);
                  }, 0);
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

                app.mySupplyOrdersDrafts((function(){
                  mySupplyOrdersDrafts = app.mySupplyOrdersDrafts();
                  $.each(mySupplyOrdersDrafts, function(i,draft){
                    if ($.inArray(draft.supply_order_id, Object.keys(app.ids_mutation()) )> 0){
                      mySupplyOrdersDrafts[i] = draft.locally_saved;
                      return false;
                    }
                  });
                  return mySupplyOrdersDrafts;
                })());
                break;
              case "my_sites":
                app.mySites(data.sites);
                break;
              case "my_supply_orders":
                  var tmp = [];
                  $.each(data.supply_orders_list, function(i,v){
                    tmp.push(formatSupplyOrders(v));
                  });
                app.mySupplyOrdersDrafts(tmp);
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
              app.last_supply_sync_date(_time_to_remember);
            }

            self.deferred.resolve();
          },
          error: function(err){
            self.deferred.reject();
          }
        });

        return self.deferred.promise();
      };

      if (drafts_ready_to_sync()){
        methods_to_chain.push('save_orders');
      }
      if ("" == method_when_update_sync_time){
        methods_to_chain.push('sync_check');
      }

      $.each(methods_to_chain, function(ix, def_func) {
        var da = new DeferredAjax(def_func);
        $.when( startdeferrpoint, app.check_online(true) ).then(
        function(){
          da.invoke();
        },
        function(){
          da.decline();
          allow_to_chain_methods = false;
        });
        if (allow_to_chain_methods){
          startdeferrpoint = da;
        } else {
          return false;
        }
      });
    };

    navigator.geolocation.getCurrentPosition(function(position){
      sync_process({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        acc: position.coords.accuracy,
        time: (new Date()).toUTCString()
      });
    }, function(error){
      sync_process();
    }, {timeout:30000, maximumAge: 0, enableHighAccuracy: true});
  },

  //TODO: refactor, refactor and refactor again
  check: function(use_geofence, callback){
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

              (new WelcomeView()).updateContent();

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
            navigator.geolocation.getCurrentPosition(
                function(position){
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
                {timeout:30000, maximumAge: 0, enableHighAccuracy: true}
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
              $deferred.resolve({
                status: 'success',
                position: [{
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                  acc: position.coords.accuracy,
                  time: (new Date()).toUTCString(),
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
            { maximumAge: 0, timeout: 60000, enableHighAccuracy: true }
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
        url: app.site+'/mobile/my_supply_orders.json',
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
/*            if (typeof success_callback == "function"){
              success_callback();
            }*/
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

    if (app.mySupplyOrdersDrafts().length > 0 || app.myLastSubmittedOrders().length > 0){
      success_callback();
    } else {
      $.when( app.get_position(), app.check_online() ).done(function(obj1, obj2 ){
        ajax_call.call(self, obj1.position);
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
/*            if (typeof success_callback == "function"){
              success_callback(data.sites);
            }*/
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

    if (app.mySites().length > 0 && !$.isEmptyObject(app.supplyOrdersTemplate())){
      success_callback();
    } else {
      $.when( app.get_position(), app.check_online() ).done(function(obj1, obj2 ){
        ajax_call.call(self, obj1.position);
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
        url: app.site+'/mobile/jobs.json',
        data: {
          id: token,
          gps: pos
        },
        cache: false,
        crossDomain: true,
        dataType: 'json',
        timeout: 60000,
        success: function(data) {
          if (data.token == token){
            if (typeof success_callback == "function"){
              success_callback(data.jobs);
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

    $.when( app.get_position(), app.check_online() ).done(function(obj1, obj2 ){
      ajax_call.call(self, obj1.position);
    }).fail(function(obj){
        app.internet_gps_error(obj);
      if ($("#overlay").is(':visible')){
        $("#overlay").hide();
      }
    });
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
      case /^#order:(\w+)$/.test(urlObj.hash):
        var order_id = urlObj.hash.match(/^#order:(\w+)$/)[1] || "new";
        app.getSitesOrdersList(function(){
          $container.html(new OrderView(order_id).render().el).trigger('pagecreate');
          (function(){$("div", $container).first().trigger('orderevent');})();});
        break;
      case /^#order-overall:(\w+)$/.test(urlObj.hash):
        var order = urlObj.hash.match(/^#order-overall:(\w+)$/)[1] || "active_order";
        $container.html(new OrderOverallView(order).render().el).trigger('pagecreate');
        break;
      case '#inspectionslog' == urlObj.hash:
        app.getInspectionsLog(function(list){
          $container.html(new InspectionsLogView(list).render().el).trigger('pagecreate');
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
      var job_insp_cont = app.getJobInspectionContainer();
      if (job_insp_cont.site_id && job_insp_cont.status == "pending" ){
        u = $.mobile.path.parseUrl(u.hrefNoHash + "#inspection:" + job_insp_cont.site_id + "-" + job_insp_cont.job_id);
      }

      if ( (/^#order[:]?(\w+)$/.test(u.hash) || /^(edit|add)OrderItem:(.*)$/i.test(u.hash) ) &&
          !(/^Area Supervisor/i.test(app.getUserInfo().role)) ){
        u = $.mobile.path.parseUrl(u.hrefNoHash);
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

  //logout
  logout: function(){
    var logout_process = function(){
//      navigator.geolocation.clearWatch(app.watchID);
//      app.watchID = null;
      app.stopCheckInterval();
      app.setToken(false);
      app.coordinates = [];
      app.setSitesToInspect([]);
      app.setJobInspectionContainer(false);
      app.autoconnect_flag = false;
      app.cancell_inspection(false);

      app.mySites(false);
      app.supplyOrdersTemplate(false);
      app.mySupplyOrdersDrafts(false);
      app.myLastSubmittedOrders(false);
      app.activeOrder(false);
      app.last_supply_sync_date(false);
      app.ids_mutation(false);

      $("#overlay").hide();

      app.route();
    };

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
      logout_process();
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
        case /^#order:(\w+)$/.test(app.current_page):

          var activeOrder = app.activeOrder(),
              cancelProcess = function (){
                app.activeOrder(false);
                app.route({
                  toPage: window.location.href + "#orders"
                });
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

  internet_gps_error: function(error){
    error = error || {};
    var title = ( error.type != "undefined" && 'gps' == error.type) ? 'Unable to determine your location' : 'Internet Connection Problem';
    var buttons = "Refresh, Back to Main Page";
    var msg = (function(e){
      if ($.isEmptyObject(error)){
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
          if (1 == buttonIndex){
            app.route({
              toPage: window.location.href + app.current_page
            });
          } else if (2 == buttonIndex){
            app.route();
          }
        },
        title,
        buttons
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