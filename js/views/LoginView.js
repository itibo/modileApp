var LoginView = function() {

  this.showErrorMessage = function(error){
    var msg = {};
    if (error.status == 0){
      msg.message = "Service unavailable. Please try later.";
    } else {
      msg = jQuery.parseJSON(error.responseText);
    }
    $('#login-form').prepend('<div>'+msg.message+'</div>');
    return this;
  };

  this.login = function(e){
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
    this.el.on('click', '#login-form button[type=button]', $.proxy(this.login, self));
  };
  this.initialize();

};

LoginView.template = Handlebars.compile($("#login-tpl").html());