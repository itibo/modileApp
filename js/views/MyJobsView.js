var MyJobsView = function() {

  this.render = function() {
    var context = {};
    context.userInfo = app.userInfo;
    context.jobsAvailiableToInspect = app.jobsAvailiableToInspect;
    this.el.html(MyJobsView.template(context));
    return this;
  };

  this.inspect = function(job_id){
    job_id = job_id || "";
    app.showConfirm('inspection', 'Are You Sure?',
      function(buttonIndex){
        if(2 == buttonIndex){
          app.inspectionJobID = job_id;
          app.route();
        }
      }
    );
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
//    this.el.on('click', 'a[href^="#inspection\\:"]', $.proxy(this.inspect, self));
    this.el.on('click', 'a.inspectable', function(event){
      var job_id = $(event.currentTarget).attr("id");
      self.inspect.call(self, job_id);
    });

  };

  this.initialize();
}

Handlebars.registerHelper('ListOfAvailiableJobs', function() {
  var out="";
  for(var i=0, l=app.jobsAvailiableToInspect.length; i<l; i++) {
    out = out + "<li><a id=\""+app.jobsAvailiableToInspect[i].id+"\" class=\"inspectable\">" +
        app.jobsAvailiableToInspect[i].location  + " (" + app.jobsAvailiableToInspect[i].address + ")</a></li>";
  }
  return new Handlebars.SafeString(out);
});


MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());