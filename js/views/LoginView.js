var LoginView = function() {

  this.login = function(e){
    e.preventDefault();
    var email = $("#email").val();
    var password = $("#password").val();
    app.getLoginToken(email, password);
  };

  this.render = function() {
    this.el.html(LoginView.template());
    return this;
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
    this.el.on('submit', 'form', $.proxy(this.login, self));
  };
  this.initialize();

};

LoginView.template = Handlebars.compile($("#login-tpl").html());