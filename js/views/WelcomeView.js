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
    context.jobsAvailiableToInspect = app.jobsAvailiableToInspect;

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
    this.el.on('click', 'a[href="#logout"]', function(event){
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
  };

  this.initialize();

}
/*
Handlebars.registerHelper('MyJobs', function() {
  return new Handlebars.SafeString(
    '<li>' + ((app.jobsAvailiableToInspect.length>0)? "<a href=\"#my_jobs\">":"") + 'My Jobs' +
        ((app.jobsAvailiableToInspect.length>0)? "<span class=\"ui-li-count\">"+app.jobsAvailiableToInspect.length +
        "</span></a>":"") + '</li>'
  );
});
*/

WelcomeView.template = Handlebars.compile($("#welcome-tpl").html());