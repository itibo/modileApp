var MyJobsView = function() {

  this.render = function() {
    var context = {};
    context.userInfo = app.getUserInfo();
    this.el.html(MyJobsView.template(context));
    return this;
  };

  this.inspect = function(id_str){
    id_arr = id_str.split("-") || [];
    var site_name = (function(site_arr){
        var tmp = "";
        $.each(app.sitesToInspect(), function(i, v){
          if (v.site_id == site_arr[0] && v.job_id == site_arr[1]){
            tmp = v.site;
            return false;
          }
        });
      return tmp;
    })(id_arr);

    navigator.notification.confirm("Do you want to start the inspection for '" + site_name + "' site?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.route({toPage: window.location.href + "#inspection:" + id_str});
        }
      },
      'Inspection',
      ['Cancel','Yes']
    );
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');

    this.el.on('click', '.inspectable button.start_inspection', function(event){
      var id_str = $("input[type=hidden]", $(event.currentTarget).parents(".inspectable")).val();
      self.inspect.call(self, id_str);
    });

    this.el.on('click', '.inspectable button.show_details', function(event){
      var id_str = $("input[type=hidden]", $(event.currentTarget).parents(".inspectable")).val();
      app.route({
        toPage: window.location.href + "#siteinfo:" + (id_str.split("-"))[0] + "-my_jobs"
      });
/*      alert("id_str: " + JSON.stringify(id_str));
      alert("sitesToInspect: " + JSON.stringify(app.sitesToInspect()));*/
    });

    this.el.on('click', '#recheck', function(event){
      event.preventDefault();
      app.check(true, function(){
        app.current_page = "#my_jobs";
        $('body>div#main').html(new MyJobsView().render().el).trigger('pagecreate');
      });
    });

    this.el.on('click', '#nearest_locations', function(event){
      event.preventDefault();
      app.route({
        toPage: window.location.href + "#nearest_locations"
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
    out = out + "<div class=\"location_details\"><p>Site(s) available for inspection, based on your current position. Select site to start inspection.</p></div>";
    out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\">";
    out = out + "<li data-role=\"list-divider\" role=\"heading\">Site(s) Assigned to You</li>";
    if (sites_for_inspect.assigned.length > 0){
      for(var i=0, l=sites_for_inspect.assigned.length; i<l; i++) {
        out = out + "<li class=\"inspectable\">" +
            "<input type=\"hidden\" value=\""+ sites_for_inspect.assigned[i].site_id + "-"+sites_for_inspect.assigned[i].job_id +"\">" +
            "<div class=\"points\">" +
              sites_for_inspect.assigned[i].site + "<br/><span class=\"address\">" + sites_for_inspect.assigned[i].address +"</span><br />" +
            "</div>" +
            ((unsubmitted_inspecion == sites_for_inspect.assigned[i].id) ? "<div class=\"unsubmitted-txt\">(UNSUBMITTED)</div>": "") +
            "<div class=\"box_rightcnt bottom\">" +
              "<button class=\"start_inspection\">Start Inspection</button>" +
              "<button class=\"show_details\">Site Details</button>" +
            "</div>" +
            "<div style=\"clear:both;\"></div>" +
          "</li>";
      }
/*      for(var i=0, l=sites_for_inspect.assigned.length; i<l; i++) {
        out = out + "<li><a id=\""+sites_for_inspect.assigned[i].site_id + "-"+sites_for_inspect.assigned[i].job_id+"\" class=\"inspectable\"><img src=\"css/images/icons_0sprite.png\" />" +
            sites_for_inspect.assigned[i].site  + " - <span class=\"address\">" + sites_for_inspect.assigned[i].address +
            ((unsubmitted_inspecion == sites_for_inspect.assigned[i].id) ? " (UNSUBMITTED)": "") +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: "+ ((app.jobsAvailiableToInspect[i].last_inspection)? app.jobsAvailiableToInspect[i].last_inspection : "never") +"</span>"+
            "</span></a></li>";
      }*/
    } else {
      out = out + "<li>no sites</li>";
    }
    out = out + "</ul>";

    if (sites_for_inspect.not_assigned.length > 0){
      out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\">";
      out = out + "<li data-role=\"list-divider\" role=\"heading\">Other sites</li>";
      for(var i=0, l=sites_for_inspect.not_assigned.length; i<l; i++) {
       out = out + "<li  class=\"inspectable\">"+
          "<input type=\"hidden\" value=\""+ sites_for_inspect.not_assigned[i].site_id+"-"+sites_for_inspect.not_assigned[i].job_id +"\">" +
          "<div class=\"points\">" +
            sites_for_inspect.not_assigned[i].site + "<br/><span class=\"address\">" + sites_for_inspect.not_assigned[i].address +"</span><br />" +
          "</div>" +
          ((unsubmitted_inspecion == sites_for_inspect.not_assigned[i].id) ? "<div class=\"unsubmitted-txt\">(UNSUBMITTED)</div>": "") +
          "<div class=\"box_rightcnt bottom\">" +
            "<button class=\"start_inspection\">Start Inspection</button>" +
            "<button class=\"show_details\">Site Details</button>" +
          "</div>" +
          "<div style=\"clear:both;\"></div>" +
        "</li>";
       }
/*      for(var i=0, l=sites_for_inspect.not_assigned.length; i<l; i++) {
        out = out + "<li><a id=\""+sites_for_inspect.not_assigned[i].site_id+"-"+sites_for_inspect.not_assigned[i].job_id+"\" class=\"inspectable\"><img src=\"css/images/icons_0sprite.png\" />" +
            sites_for_inspect.not_assigned[i].site  + " - <span class=\"address\">" + sites_for_inspect.not_assigned[i].address +
            ((unsubmitted_inspecion == sites_for_inspect.not_assigned[i].id) ? " (UNSUBMITTED)": "") +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: "+ ((app.jobsAvailiableToInspect[i].last_inspection)? app.jobsAvailiableToInspect[i].last_inspection : "never") +"</span>"+
            "</span></a></li>";
      }*/
      out = out + "</ul>";
    }
  } else {
    out = out + "<div class=\"location_details\"><p>No site(s) available for inspection, based on your current position.</p></div>";
  }

  return new Handlebars.SafeString(out);
});

MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());