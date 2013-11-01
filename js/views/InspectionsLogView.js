var InspectionsLogView = function(data) {
  this.data = data || [];

/*  this.data1 = (function(data1){
    var return_arr = [];
    $.each(data1, function(i,log_obj){
      var return_data = {};
      var transformed_dates = (function(){

        $.extend(return_data,
            $.Deferred(function(defer) {
                  navigator.globalization.dateToString(
                      new Date(log_obj.arrival_time),
                      function(res) {
                        defer.resolve({arrival_time: res.value});
                      },
                      function() {
                        defer.resolve({arrival_time: log_obj.arrival_time});
                      },
                      {formatLength:'short', selector:"date and time"}
                  )
                }
            )
        );
        $.extend(return_data,
            $.Deferred(function(defer) {
                  navigator.globalization.dateToString(
                      new Date(log_obj.departure_time),
                      function(res) {
                        defer.resolve({departure_time: res.value});
                      },
                      function() {
                        defer.resolve({departure_time: log_obj.departure_time});
                      },
                      {formatLength:'short', selector:"date and time"}
                  )
                }
            )
        );
        $.extend(return_data,
            $.Deferred(function(defer) {
                  navigator.globalization.dateToString(
                      new Date(log_obj.last_inspection_time),
                      function(res) {
                        defer.resolve({last_inspection_time: res.value});
                      },
                      function() {
                        defer.resolve({last_inspection_time: log_obj.last_inspection_time});
                      },
                      {formatLength:'short', selector:"date and time"}
                  )
                }
            )
        );
        return return_data;
      })();

      $.when.apply(null, transformed_dates).then(function(result){
        var args = arguments;
        alert("in then result: " + JSON.stringify(result));
        alert("in then args: " + JSON.stringify(args));
      }, function(err){
        alert("in then err: " + JSON.stringify(err));
      });
      return false;
    });
    return return_arr;
  })(data || []);*/

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
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
    if (inspectionsLog.unsubmitted){
      out = out + "<li><div class=\"left_points\">" + inspectionsLog.unsubmitted.site  + " - <span class=\"adress\">" + inspectionsLog.unsubmitted.address + "(UNSUBMITTED)</span></div></li>";
    }

    for(var i=0, l=items.length; i<l; i++) {
      out = out + "<li>" +
          "<div class=\"points\">" + items[i].site  + " - <span class=\"adress\">" + items[i].address + "</span></div>" +
          "<div class=\"left_points\">" +
            "<div class=\"points_time\">" +
              "<span class=\"time\">Initiated: <font >" + items[i].arrival_time + "</font></span><br />" +
              "<span class=\"time\">Completed: <font >" + items[i].departure_time + "</font></span>" +
            "</div>" +
          "</div>" +
          "<div class=\"right_points\">" +
            "<div class=\"box_points\">" +
              "<div>" +
                "<span class=\"points_class\">Score</span><br />" +
                "<span class=\"big_points\">" + items[i].percent + "%</span><br />" +
                "<span class=\"procent\">(" + items[i].points + " of " + items[i].total_points + ")</span>" +
              "</div>" +
            "</div>" +
          "</div>" +
        "</li>";
    }
    out = out + "</ul>";
  } else {
    out = out + "<p>You haven't made any inspection yet.</p>";
  }
  return new Handlebars.SafeString(out);
});

InspectionsLogView.template = Handlebars.compile($("#inspectionslog-tpl").html());