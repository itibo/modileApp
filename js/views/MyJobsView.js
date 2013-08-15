var MyJobsView = function() {

  this.render = function() {
    var context = {};
    context.userInfo = app.userInfo;
    context.jobsAvailiableToInspect = app.jobsAvailiableToInspect;
    this.el.html(MyJobsView.template(context));
    return this;
  };

  this.inspect = function(job_id){
    var job_id = job_id || "";
    var site_name = (function(site_id){
        var tmp = "";
        $.each(app.jobsAvailiableToInspect, function(i, v){
          if (v.id == site_id){
            tmp = v.location;
            return false;
          }
        });
      return tmp;
    })(job_id);

    navigator.notification.confirm("Do you want to start the inspection for '" + site_name + "' location?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.inspectionJobID = job_id;
          app.route();
        }
      },
      'Inspection', 'Cancel,Yes'
    );
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
    this.el.on('click', 'a.inspectable', function(event){
      var job_id = $(event.currentTarget).attr("id");
      self.inspect.call(self, job_id);
    });

  };

  this.initialize();
}

Handlebars.registerHelper('ListOfAvailiableJobsContent', function() {
  var out="";
  if ( app.jobsAvailiableToInspect.length > 0 ){
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">" +
        "<li data-role=\"list-divider\" role=\"heading\">" +
        "Below are the list of sites (locations) available for inspection in current position. Please click on site name to start the inspection." +
        "</li>";
    for(var i=0, l=app.jobsAvailiableToInspect.length; i<l; i++) {
      out = out + "<li><a id=\""+app.jobsAvailiableToInspect[i].id+"\" class=\"inspectable\">" +
          app.jobsAvailiableToInspect[i].location  + " (" + app.jobsAvailiableToInspect[i].address + ")<br />" +
          "<span style=\"font-size: 0.8em;\">Last inspection: "+ ((app.jobsAvailiableToInspect[i].last_inspection)? app.jobsAvailiableToInspect[i].last_inspection : "never") +"</span></a></li>";
    }
    out = out + "</ul>";
  } else {
    out = out + "<p>There are no sites (locations) available for inspection in current position.</p>";
  }

  return new Handlebars.SafeString(out);
});

MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());