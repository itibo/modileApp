var app = {

  // Application Constructor
  initialize: function() {
    // config
    this.site = 'http://209.123.209.168:3000';
//    this.site = 'http://192.168.92.208:3000';
    this.lat = 0;
    this.lon = 0;
    this.push_id = '';
    this.token = false;

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
    // TODO: для тестинга на обычном браузере, удалить по окончанию работы
    window.addEventListener('load', $.proxy(this.onDeviceReady, self), false);
  },
  // deviceready Event Handler
  //
  // The scope of 'this' is the event. In order to call the 'receivedEvent'
  // function, we must explicity call 'app.receivedEvent(...);'
  onDeviceReady: function() {
    var self = this;
    self.route();

    $(document).bind( "pagebeforechange", function( e, data ) {
      if ( typeof data.toPage === "string" ) {
        self.route(data);
        e.preventDefault();
      }
    });
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
    console.log("app.token: ", app.token);
    console.log("routing...");
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
  getLoginToken: function(email, password, number){
    number = 1;
    console.log("app.site: ", app.site);
    $.ajax({
      type: "POST",
      url: app.site+'/mobile/login.json',
      data: {email: email,
        password: password,
        number: number,
        lat: app.lat,
        lon: app.lon,
        device: {uuid: device.uuid,
          platform: device.platform},
        push_id: app.push_id},
      cache: false,
      crossDomain: true,
      dataType: 'json',
      success: function(data) {
        app.token = data.token;
//        app.user = data.user;
//      Запускаем GPS один раз и потом ловим ивенты
        /*        app.getGPS();
         app.show_workaround();
         */
        app.route();
      },
      error: function(error){
        console.log(error);
      }

    });
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
