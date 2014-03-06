var NearestLocationsView = function() {

  this.render = function() {
    var context = {};

    context.nearest_loc_filter = (function(){
      return app.nearestLocationsFilter() || "by_dist";
    })();

    /* prepare sites for display */

    context.mysites = (function(){
      var ret = [],
          compare_by_inspection_date = function(a,b){
            if ((new Date(a.last_inspection_date)) < (new Date(b.last_inspection_date)))
              return -1;
            if ((new Date(a.last_inspection_date)) > (new Date(b.last_inspection_date)))
              return 1;
            return 0;
          },
          compare_by_dist = function(a,b){
            if (isNaN(parseFloat(a.distance)))
              return -1;
            if (parseFloat(a.distance) < parseFloat(b.distance))
              return -1;
            if (parseFloat(a.distance) > parseFloat(b.distance))
              return 1;
            return 0;
          },
          get_dist = function(lat1,lon1,lat2,lon2){
            var lat1 = parseFloat(lat1);
            var lon1 = parseFloat(lon1);
            var lat2 = parseFloat(lat2);
            var lon2 = parseFloat(lon2);
            var R = 6371; // km
            var dLat = (lat2-lat1).toRad();
            var dLon = (lon2-lon1).toRad();
            lat1 = lat1.toRad();
            lat2 = lat2.toRad();

            var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2);
            var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return (R * c);
          };
      try {
        $.each(app.mySites(), function(i,s){
          if (s.assigned){
            var obj = $.extend(true, {}, s,
                {
                  distance: ($.isEmptyObject(app.lastLocation)
                      ? null
                      : (parseFloat(get_dist(s.circle_latitude, s.circle_longitude, app.lastLocation.lat, app.lastLocation.lng))
                        - (parseFloat(s.circle_radius))))
                }
            );

            if (/* false *//*true*/ obj.distance * 0.621371 <= app.nearestLocDist
                && (new Date() - new Date(obj.last_inspection_date)) / (1000 * 3600 * 24) >= app.nearestLocDuration()){
              ret.push(obj);
            }
          }
        });
      } catch (e){}

      if ("by_date" === context.nearest_loc_filter){
        ret.sort(compare_by_inspection_date);
      } else if ("by_dist" === context.nearest_loc_filter){
        if ($.isEmptyObject(app.lastLocation)){
          context.nearest_loc_filter = app.nearestLocationsFilter("by_date");
          ret.sort(compare_by_inspection_date);
        } else {
          ret.sort(compare_by_dist);
        }
      }
      return ret.slice(0,10);
    })();

    this.el.html(NearestLocationsView.template(context));
    return this;
  };

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');

    this.el.on("change", "select#nearest_loc_filter", function(e){
      e.preventDefault();
      app.nearestLocationsFilter($(e.currentTarget).val());
      $('body>div#main').html(new NearestLocationsView().render().el).trigger('pagecreate');
    });

    this.el.on("click", "#refresh", function(e){
      e.preventDefault();
      $("#overlay").show(1, function(){
        $.when( app.get_position() ).always(function(){
          $('body>div#main').html(new NearestLocationsView().render().el).trigger('pagecreate');
          $("#overlay").hide();
          if ($("#menu").is(":visible")){
            $("#menu").toggle();
          }
        });
      });
    });

    this.el.on('click', ".btn-back a", function(e){
      e.preventDefault();
      app.backButton();
    });

    this.el.on('click', '.show_details', function(event){
      app.route({
        toPage: window.location.href + "#siteinfo:" + $(event.currentTarget).attr("data-siteid") + "-nearest_locations"
      });
    });

    this.el.on('click', '.route', function(event){
      app.route({
        toPage: window.location.href + "#siteinfo:" + $(event.currentTarget).attr("data-siteid") + "-nearest_locations"
      });
    });

  };
  this.initialize();
}

Handlebars.registerHelper('IntroText', function(){
  return new Handlebars.SafeString("<div class=\"location_details\">" +
    "<p>Below are the list of nearest site locations (within "+ app.nearestLocDist +" mi distance to your current position) that haven't been visited within last "+ app.nearestLocDuration() +" days. </p>"+
  "</div>");
});


Handlebars.registerHelper('NearestLocationsFilterContent', function(){
  var out = "<select id=\"nearest_loc_filter\">" +
    "<option "+ (("by_dist" === this.nearest_loc_filter)? ("selected=\"selected\" "): "") +"value=\"by_dist\">Sort by distance</option>" +
    "<option "+ (("by_date" === this.nearest_loc_filter)? ("selected=\"selected\" "): "") +"value=\"by_date\">Sort by Inspection Date</option>" +
  "</select>";
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('NearestLocationsContent', function(){
  var out = "<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\">" +
      "<li data-role=\"list-divider\" role=\"heading\">Nearest Locations ("+ this.mysites.length +")</li>";

  if (this.mysites.length > 0){
    $.each(this.mysites, function(i,s){
      out = out + "<li class=\"inspectable\">" +
        "<div class=\"points\">" +
          "<div class=\"box_rightcnt\" style=\"padding: 0; width: auto;\">" +
            ( s.distance > 0
                ? (s.distance.toMiles() + "mi")
                : "you are here" ) +
          "</div>" +
          s.site + "<br/>" +
          "<span class=\"address\">"+ s.address +"</span><br />" +
          "<span class=\"address\">Inspected: "+(s.last_inspection_date
            ? ("<time datetime=\""+(new Date(s.last_inspection_date)).toJSON()+"\">"+
                $.prettyDate.format(new Date(s.last_inspection_date).toJSON()) +
              "</time>")
            :"never") +
          "</span>" +
        "</div>" +
        "<div class=\"box_rightcnt bottom\">" +
          "<button class=\"show_details\" data-siteid=\""+ s.site_id +"\">Site Details</button>" +
          "<a class=\"button\" data-role=\"button\" href=\"geo:"+app.lastLocation.lat +","+app.lastLocation.lng+"?q="+s.circle_latitude+","+s.circle_longitude+"\">See Route</a>" +
        "</div>" +
        "<div style=\"clear:both;\"></div>" +
      "</li>";
    });
  } else {
    out = out + "<li class=\"inspectable\">There are no sites that require inspection within "+ app.nearestLocDist +" mi distance.</li>";
  }

  out = out + "</ul>";

  out = out + "<div class=\"all_input stnd_btn\"><input type=\"button\" id=\"refresh\" value=\"Refresh\"/></div>";

  return new Handlebars.SafeString(out);
});

NearestLocationsView.template = Handlebars.compile($("#nearest-locations-tpl").html());