var WelcomeView = function() {

  this.updateContent = function(){
    var self = this;
    var parent_elm = ($('#welcome-container').parent('#main'))?$('#welcome-container').parent('#main'):false;
    if (parent_elm){
      $(parent_elm).html(self.render().el).trigger('pagecreate');
    }
  }

  this.render = function() {
    var context = {};
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;

    this.el.html(WelcomeView.template(context));
    return this;
  };

  this.logout = function(){
    app.logout();
  }

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div id="welcome-container" />');

    this.el.on('click', 'a[href="#close"]', function(event){
      event.preventDefault();
      app.showConfirm('Close', 'Do you want to quit? ',
        function(buttonIndex){
          if(2 == buttonIndex){
            app.stopCheckInterval();
            navigator.app.exitApp();
          }
        }
      );
    });

    this.el.on('click', '.logo_img', function(event){
      event.preventDefault();
      $("#menu").toggle();
    });

  };

  this.initialize();

}

Handlebars.registerHelper('SupplierMenuItem', function() {
  var return_html='';
  try{
    if (/^Area Supervisor/i.test(this.userInfo.role)){
      return_html = '<li><a href="#order:new"><img src="css/images/icons_4.png"/>New Supply Order</a></li>' +
        '<li><a href="#orders"><img src="css/images/icons_4.png"/>Supply Orders History</a></li>';
    }
  } catch(e) {
    return_html='';
  }
  return new Handlebars.SafeString(return_html);
});

WelcomeView.template = Handlebars.compile($("#welcome-tpl").html());