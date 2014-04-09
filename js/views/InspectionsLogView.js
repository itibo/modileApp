var InspectionsLogView = function(data) {
  this.data = data || [];

  this.render = function() {
    var self = this;
    var unsubmitted = (function(){
      var result = null;
      var saved_inspection = app.getJobInspectionContainer();
      if ("submitting" == saved_inspection.status){
        $.each(app.sitesToInspect(), function(i,v){
          if (saved_inspection.id == v.id){
            result = v;
            return false;
          }
        });
      }
      return result;
    })();

    var context = {
      userInfo: app.getUserInfo(),
      inspectionsLog: {
        unsubmitted: unsubmitted,
        log: self.data
      }
    };

    this.el.html(InspectionsLogView.template(context));
    return this;
  };

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
  };
  this.initialize();
}

Handlebars.registerHelper('ListInspectionsLog', function(inspectionsLog) {
  var items = inspectionsLog.log,
    out = ["<ul data-role=\"listview\" data-inset=\"true\">",
        "<li data-role=\"list-divider\" role=\"heading\">Below are the list of inspections completed by you in last two months ("+ items.length +").</li>"];;

  //Below are the list of inspections completed by you in last two months.
  if (items.length>0 || inspectionsLog.unsubmitted){
    if (inspectionsLog.unsubmitted){
      out.push("<li><div class=\"left_points\">" + inspectionsLog.unsubmitted.site  + "<br/><span class=\"address\">" + inspectionsLog.unsubmitted.address + "(UNSUBMITTED)</span></div></li>");
    }

    for(var i=0, l=items.length; i<l; i++) {
      out.push("<li>" +
          "<div class=\"points\">" + items[i].site  + "<br/><span></span><span class=\"address\">" + items[i].address + "</span></div>" +
          "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
            "<td class=\"points_time\">" +
              "<span class=\"time\">Initiated: <font >" + items[i].initiated_time + "</font></span><br />" +
              "<span class=\"time\">Completed: <font >" + items[i].completed_time + "</font></span>" +
            "</td>" +
            "<td class=\"right_points\">" +
              "<div class=\"box_points\">" +
                "<div>" +
                  "<span class=\"points_class\">Score</span><br />" +
                  "<span class=\"big_points\">" + items[i].percent + "%</span><br />" +
                  "<span class=\"procent\">(" + items[i].points + " of " + items[i].total_points + ")</span>" +
                "</div>" +
              "</div>" +
            "</td>" +
          "</tr></table>" +
        "</li>");
    }
    out.push("</ul>");
  } else {
    out.push("<p>You haven't made any inspection yet.</p>");
  }
  return new Handlebars.SafeString(out.join(""));
});

InspectionsLogView.template = Handlebars.compile($("#inspectionslog-tpl").html());