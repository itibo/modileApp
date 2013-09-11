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
  var out = "";
  var items = inspectionsLog.log;
  if (items.length>0 || inspectionsLog.unsubmitted){
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">" +
        "<li data-role=\"list-divider\" role=\"heading\">Last accomplished inspections:</li>";

    if (inspectionsLog.unsubmitted){
      out = out + "<li>" + inspectionsLog.unsubmitted.site  + " (" + inspectionsLog.unsubmitted.address + ") (UNSUBMITTED)</li>";
    }

    for(var i=0, l=items.length; i<l; i++) {
      out = out + "<li>" + items[i].site  + " (<span style=\"font-size: 0.8em; font-style: italic;\">" + items[i].address + "&nbsp;</span>) " +
          "<br />" +
          "<span style=\"font-size: 0.8em;\">Total points: " + items[i].total_points + "</span>" +
          "<br />" +
          "<span style=\"font-size: 0.8em;\">Points: " + items[i].points + "</span>" +
          "<br />" +
          "<span style=\"font-size: 0.8em;\">Percent: " + items[i].percent + "%</span>" +
          "<br />" +
          "<span style=\"font-size: 0.8em;\">Arrival time: " + items[i].arrival_time + "</span>" +
          "<br />" +
          "<span style=\"font-size: 0.8em;\">Departure time: " + items[i].departure_time + "</span>" +
        "</li>";
    }
    out = out + "</ul>";
  } else {
    out = out + "<p>You haven't made any inspection yet.</p>";
  }
  return new Handlebars.SafeString(out);
});

InspectionsLogView.template = Handlebars.compile($("#inspectionslog-tpl").html());