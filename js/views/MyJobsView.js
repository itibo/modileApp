var MyJobsView = function() {

  this.render = function() {
    var context = {};
    context.userInfo = app.getUserInfo();
    this.el.html(MyJobsView.template(context));
    return this;
  };

  this.inspect = function(id){
    id = id || "";
    var site_name = (function(site_id){
        var tmp = "";
        $.each(app.sitesToInspect(), function(i, v){
          if (v.id == site_id){
            tmp = v.site;
            return false;
          }
        });
      return tmp;
    })(id);

    navigator.notification.confirm("Do you want to start the inspection for '" + site_name + "' site?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.route({toPage: window.location.href + "#inspection:" + id});
        }
      },
      'Inspection',
      'Cancel,Yes'
    );
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
    this.el.on('click', 'a.inspectable', function(event){
      var id = $(event.currentTarget).attr("id");
      self.inspect.call(self, id);
    });

    this.el.on('click', '#recheck', function(event){
      event.preventDefault();
      app.check(true, function(){
        $('body>div#main').html(new MyJobsView().render().el).trigger('pagecreate');
      });
    });
  };

  this.initialize();
}

Handlebars.registerHelper('ListOfAvailiableJobsContent', function(){
  var unsubmitted_inspecion = (function(){
    if(app.getJobInspectionContainer().status == "submitting"){
      return app.getJobInspectionContainer().id;
    }
    return false;
  })();

  var sites_for_inspect = (function(){
    var tmp = {
      assigned: [],
      not_assigned: []
    };

    $.each(app.sitesToInspect(), function(i,v){
      if(v.assigned){
        tmp.assigned.push(v);
      } else {
        tmp.not_assigned.push(v);
      }
    });

    return tmp;
  })();

  var out="";
  if ( (app.sitesToInspect()).length > 0 ){
    out="<p>Site(s) available for inspection, based on your current position. Select site to start inspection.</p>";
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
    out = out + "<li data-role=\"list-divider\" role=\"heading\">Site(s) Assigned to You</li>";
    if (sites_for_inspect.assigned.length > 0){
      for(var i=0, l=sites_for_inspect.assigned.length; i<l; i++) {
        out = out + "<li><a id=\""+sites_for_inspect.assigned[i].id+"\" class=\"inspectable\"><img src=\"css/images/icons_0sprite.png\" />" +
            sites_for_inspect.assigned[i].site  + " (" + sites_for_inspect.assigned[i].address + ")" +
            ((unsubmitted_inspecion == sites_for_inspect.assigned[i].id) ? " (UNSUBMITTED)": "") +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: "+ ((app.jobsAvailiableToInspect[i].last_inspection)? app.jobsAvailiableToInspect[i].last_inspection : "never") +"</span>"+
            "</a></li>";
      }
    } else {
      out = out + "<li>no sites</li>";
    }
    out = out + "</ul>";

    if (sites_for_inspect.not_assigned.length > 0){
      out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
      out = out + "<li data-role=\"list-divider\" role=\"heading\">Other sites</li>";
      for(var i=0, l=sites_for_inspect.not_assigned.length; i<l; i++) {
        out = out + "<li><a id=\""+sites_for_inspect.not_assigned[i].id+"\" class=\"inspectable\"><img src=\"css/images/icons_0sprite.png\" />" +
            sites_for_inspect.not_assigned[i].site  + " (" + sites_for_inspect.not_assigned[i].address + ")" +
            ((unsubmitted_inspecion == sites_for_inspect.not_assigned[i].id) ? " (UNSUBMITTED)": "") +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: "+ ((app.jobsAvailiableToInspect[i].last_inspection)? app.jobsAvailiableToInspect[i].last_inspection : "never") +"</span>"+
            "</a></li>";
      }
      out = out + "</ul>";
    }
  } else {
    out = out + "<p>No site(s) available for inspection, based on your current position.</p>";
  }

  return new Handlebars.SafeString(out);
});

MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());