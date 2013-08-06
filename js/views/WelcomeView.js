var WelcomeView = function() {

  this.render = function() {
    var context = app.userInfo;
    this.el.html(WelcomeView.template(context));
    return this;
  };

  this.logout = function(){
    app.logout();
  }

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
    this.el.on('click', 'a[href="#logout"]', $.proxy(this.logout, self));
  };

  this.initialize();

}

WelcomeView.template = Handlebars.compile($("#welcome-tpl").html());