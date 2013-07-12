var app = {
  token: '',
  worker: '',
//  site: 'http://209.123.209.168:3000',
  site: 'http://192.168.92.208:3000',
  jobs: '',
  lat: 0,
  lon: 0,
  watchID: null,
  counter: 0,
  push_id: '',
  gps_connect_timeout: 60000,
  last_gps_connect_time: 0,
  initialize: function() {
    this.bind();
  },
  bind: function() {
    document.addEventListener('deviceready', this.deviceready, false);
  },
  deviceready: function() {
    document.addEventListener('unload', app.logOut, false);
    document.addEventListener('backbutton', app.backButton, false);
    document.querySelector('#login-submit').addEventListener('click', app.logIn, false);
    document.querySelector('#login-exit').addEventListener('click', app.logOut, false);
    document.querySelector('#get-jobs-list').addEventListener('click', app.getJobsList, false);
    document.querySelector('#check-current-jobs').addEventListener('click', app.getCheckList, false);
    app.report('deviceready');
    app.pushRegister();
  },

  pushRegister: function(){
      var pushNotification;
      try
      {
          pushNotification = window.plugins.pushNotification;
          if (device.platform == 'android' || device.platform == 'Android') {
              $("#app-status-ul").append('<li>registering android</li>');
              pushNotification.register(app.successHandler, app.errorHandler, {"senderID":"216199045656","ecb":"app.onNotificationGCM"});		// required!
          } else {
              $("#app-status-ul").append('<li>registering iOS</li>');
              pushNotification.register(app.tokenHandler, app.errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"app.onNotificationAPN"});	// required!
          }
      }
      catch(err)
      {
          txt="There was an error on this page.\n\n";
          txt+="Error description: " + err.message + "\n\n";
          alert(txt);
      }
  },

  successHandler: function (result) {
    $("#app-status-ul").append('<li>success:'+ result +'</li>');
  },

  errorHandler: function(error) {
    $("#app-status-ul").append('<li>error:'+ error +'</li>');
  },

  // handle APNS notifications for iOS
  onNotificationAPN: function (e) {
    $("#app-status-ul").append('<li>onNotificationAPNing....</li>');
    if (e.alert) {
        $("#app-status-ul").append('<li>push-notification: ' + e.alert + '</li>');
        navigator.notification.alert(e.alert);
    }

    if (e.sound) {
/*        var snd = new Media(e.sound);
        snd.play();
*/
    }

    if (e.badge) {
        pushNotification.setApplicationIconBadgeNumber(app.successHandler, e.badge);
    }
  },

  tokenHandler: function(result) {
    app.push_id = result;
    $("#app-status-ul").append('<li>token: '+ result +'</li>');
    // Your iOS push server needs to know the token before it can push to this device
    // here is where you might want to send it the token for later use.
  },

  // handle GCM notifications for Android
  onNotificationGCM: function(e) {
    $("#app-status-ul").append('<li>EVENT -> RECEIVED:' + e.event + '</li>');

    switch( e.event )
    {
        case 'registered':
            if ( e.regid.length > 0 )
            {
                $("#app-status-ul").append('<li>REGISTERED -> REGID:' + e.regid + "</li>");
                app.push_id = e.regid;
                // Your GCM push server needs to know the regID before it can push to this device
                // here is where you might want to send it the regID for later use.
                console.log("regID = " + e.regID);
            }
            break;

        case 'message':
            // if this flag is set, this notification happened while we were in the foreground.
            // you might want to play a sound to get the user's attention, throw up a dialog, etc.
            if (e.foreground)
            {
                $("#app-status-ul").append('<li>--INLINE NOTIFICATION--' + '</li>');

                // if the notification contains a soundname, play it.
/*                var my_media = new Media("/android_asset/www/"+e.soundname);
                my_media.play();
*/
            }
            else
            {	// otherwise we were launched because the user touched a notification in the notification tray.
                if (e.coldstart)
                    $("#app-status-ul").append('<li>--COLDSTART NOTIFICATION--' + '</li>');
                else
                    $("#app-status-ul").append('<li>--BACKGROUND NOTIFICATION--' + '</li>');
            }

            $("#app-status-ul").append('<li>MESSAGE -> MSG: ' + e.payload.message + '</li>');
            $("#app-status-ul").append('<li>MESSAGE -> MSGCNT: ' + e.payload.msgcnt + '</li>');
            break;

        case 'error':
            $("#app-status-ul").append('<li>ERROR -> MSG:' + e.msg + '</li>');
            break;

        default:
            $("#app-status-ul").append('<li>EVENT -> Unknown, an event was received and we do not know what it is</li>');
            break;
    }
},

  show_workaround: function(){
    $('#deviceready').hide();
    $('#worker-info-div').show();
    $('#workaround').show();
    $('#jobs-list-div').hide();
    $('#worker-name-label').text('Worker: ' + app.worker.display_name);
    app.show_deviceinfo();
  },
  show_deviceready: function(){
    $('#worker-info-div').hide();
    $('#workaround').hide();
    $('#deviceready').show();
    $('#jobs-list-div').hide();
  },
  show_jobs_list: function(){
    $('#worker-info-div').show();
    $('#workaround').hide();
    $('#deviceready').hide();
    $('#jobs-list-div').show();
    $('#jobs-list-div').find('.jobs-list').remove();
    $('#jobs-list-back').parent().append('<ul class="jobs-list"></ul>');
    var contains = $('#jobs-list-div').find('ul');
    app.jobs.forEach(function(value, index, array){
      contains.append('<li></li>');
      var li = contains.find('li').last();
      li.append('<h4>'+value.description+'</h4>');
      li.append('<dl><dt>company:</dt><dd>'+value.location.company+'</dd></dl>');
      li.append('<dl><dt>address:</dt><dd>'+value.location.address+'</dd></dl>');
      li.append('<dl><dt>contact:</dt><dd>'+value.location.contact_name+'</dd></dl>');
      li.append('<dl><dt>phone:</dt><dd>'+value.location.contact_phone+'</dd></dl>');
      li.append('<dl><dt>status:</dt><dd>'+value.status+'</dd></dl>');
    });
  },
  report: function(id) {
    console.log("report:" + id);
    document.querySelector('#' + id + ' .pending').className += ' hide';
    var completeElem = document.querySelector('#' + id + ' .complete');
    completeElem.className = completeElem.className.split('hide').join('');
  },
  checkLocation: function(){
    alert('check current location!');
  },
  logIn: function(){
    var email = $("#email").val();
    var password = $("#pass").val();
    var number = $("#num").val();
    app.getLoginToken(email, password, number);
  },
  logOut: function(){
    app.getGPS();
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/logout.json',
      data: {id: app.token, lat: app.lat, lon: app.lon},
      cache: false,
      dataType: 'json',
      success: function(data) {
        app.token = '';
        if (app.watchID != null) {
          navigator.geolocation.clearWatch(app.watchID);
          app.watchID = null;
          app.counter = 0;
        }
        app.show_deviceready();
      },
      error: function(error) {
        app.showError(error);
      }
    });
  },
  getLoginToken: function(email, password, number){
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/login.json',
      data: {email: email, password: password, number: number, lat: app.lat, lon: app.lon, device_uuid: device.uuid, push_id: app.push_id},
      cache: false,
      dataType: 'json',
      success: function(data) {
        console.log('data=', data);
        app.token = data.token;
        app.worker = data.worker;
//      Запускаем GPS один раз и потом ловим ивенты
        app.getGPS();
        app.show_workaround();
      },
      error: function(error) {
        app.showError(error);
      }
    });
  },
  showConfirm: function(title, question, on_submit_event) {
    navigator.notification.confirm(
        question,
        on_submit_event,
        title,
        'Cancel,OK'
    );
  },
  exitFromApp: function(buttonIndex){
    console.log('try exit');
    if (buttonIndex==2){
      if (app.token!=''){
        app.logOut();
      }
      navigator.app.exitApp();
    }
  },
  getJobsList:function(){
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/jobs.json',
      data: {id: app.token, lat: app.lat, lon: app.lon},
      cache: false,
      dataType: 'json',
      success: function(data) {
        console.log(data);
        app.jobs = data.jobs;
        app.show_jobs_list();
      },
      error: function(error) {
        app.showError(error);
      }
    });
  },
  getGPS:function(){
    var geolocationSuccess = function(position){
      if (app.watchID != null) {
        app.lat = position.coords.latitude;
        app.lon = position.coords.longitude;
        app.setGPSCoords();
      }
    };
    var geolocationError = function(PositionError){
      console.log(PositionError.message);
      alert(PositionError.message);
    };
    var geolocation = navigator.geolocation;
    if (geolocation){
      app.watchID = geolocation.watchPosition(geolocationSuccess,geolocationError, {enableHighAccuracy: true, maximumAge: 30000, timeout: 60000 })
    }
  },
  getCheckList:function(){
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/check.json',
      data: {id: app.token, lat: app.lat, lon: app.lon},
      cache: false,
      dataType: 'json',
      success: function(data) {
        alert('success: checked '+data.locations.length+' location(s)');
        console.log(data.locations);
      },
      error: function(error) {
        app.showError(error);
      }
    });
  },
  setGPSCoords:function(){
    var new_time = new Date();
    if (new_time - app.last_gps_connect_time > app.gps_connect_timeout){
      $.ajax({
        type: "POST",
//    TODO Тут надо другой роут!!
        url: app.site+'/mobile/check.json',
        data: {id: app.token, lat: app.lat, lon: app.lon},
        cache: false,
        dataType: 'json',
        success: function(data) {
          app.counter = app.counter + 1;
          app.last_gps_connect_time = new_time;
          $('#gps-request-counter').text(app.counter);
        },
        error: function(error) {
          app.showError(error);
        }
      });

    }
  },
  backButton:function(){
    app.showConfirm('exit', 'Quit?', app.exitFromApp);
  },
  showError: function(error){
    alert('ERROR: ' + error.responseJSON.message);
  },
  show_deviceinfo: function(){
    var element = document.getElementById('device-info');

    element.innerHTML = 'Device Name: '     + device.name     + '<br />' +
        'Device Cordova: '  + device.cordova + '<br />' +
        'Device Platform: ' + device.platform + '<br />' +
        'Device UUID: '     + device.uuid     + '<br />' +
        'Device Version: '  + device.version  + '<br />';
  }

};
