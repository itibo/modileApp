var MyJobsView = function() {

  this.render = function() {
    var context = {};
    context.userInfo = app.userInfo;
    context.jobsAvailiableToInspect = app.jobsAvailiableToInspect;
//    alert(JSON.stringify(app.jobsAvailiableToInspect));
    this.el.html(MyJobsView.template(context));
    return this;
  };

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
  };

  this.initialize();

}

Handlebars.registerHelper('ListOfAvailiableJobs', function() {
  var out="";
  for(var i=0, l=app.jobsAvailiableToInspect.length; i<l; i++) {
    out = out + "<li>" + app.jobsAvailiableToInspect[i].location  + " " + app.jobsAvailiableToInspect[i].address + "</li>";
  }
  return out;
});


MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());