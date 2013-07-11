var app = {
  token: '',
  worker: '',
  site: 'http://209.123.209.168:3000',
  jobs: '',
  lat: 0,
  lon: 0,
  watchID: null,
  counter: 0,
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
              pushNotification.register(successHandler, errorHandler, {"senderID":"216199045656","ecb":"onNotificationGCM"});		// required!
          } else {
              $("#app-status-ul").append('<li>registering iOS</li>');
              pushNotification.register(tokenHandler, errorHandler, {"badge":"true","sound":"true","alert":"true","ecb":"onNotificationAPN"});	// required!
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

  show_workaround: function(){
    $('#deviceready').hide();
    $('#worker-info-div').show();
    $('#workaround').show();
    $('#jobs-list-div').hide();
    $('#worker-name-label').text('Worker: ' + app.worker.display_name);
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
      data: {email: email, password: password, number: number, lat: app.lat, lon: app.lon},
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
  }

};
