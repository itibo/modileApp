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
    context.userInfo = app.userInfo;
    context.jobsAvailiableToInspect = app.jobsAvailiableToInspect;

    this.el.html(WelcomeView.template(context));
    return this;
  };

  this.logout = function(){
    app.logout();
  }

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div id="welcome-container" />');
    this.el.on('click', 'a[href="#logout"]', $.proxy(this.logout, self));
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