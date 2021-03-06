var SitesListView = function(data) {
  this.data = data || [];
  this.reordered_sites = {};

  this.render = function() {
    var self = this,
        context = {};
    context.userInfo = app.getUserInfo();
    context = $.extend(context, {sites: self.data}, {filters: app.sitesFilters()});
    this.el.html(SitesListView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');

    this.el.on("change", "select[name^=client]", function(e){
      e.preventDefault();
      var filters = {};
      if ( $.isEmptyObject(self.reordered_sites) ) {
        var tmp = {};
        $.each(self.data, function(i, value){
          if ("undefined" == typeof tmp[value.client]){
            tmp[value.client] = {};
          }
          if ("undefined" == typeof tmp[value.client][value.client_group]){
            tmp[value.client][value.client_group] = [];
          }
          tmp[value.client][value.client_group].push(value);
        });
        self.reordered_sites = tmp;
      }

      if ("client" == $(e.currentTarget).attr("id")){
        switch (true) {
          case $(e.currentTarget).val().length == 0:
            $("select#client_group").html("<option value=\"\">- All Client Groups -</option>");
            $("select#client_group").selectmenu('disable').selectmenu('refresh', true);
            break;
          case $(e.currentTarget).val().length > 0:
          default:
            var client_groups_array = Object.keys(self.reordered_sites[$(e.currentTarget).val()]);
            if (1 == client_groups_array.length ){
              if ("null" == client_groups_array[0]){
                $("select#client_group").html("<option value=\"null\"></option>");
                $("select#client_group").selectmenu('disable').selectmenu('refresh', true);
              } else {
                $("select#client_group").html("<option value=\""+ client_groups_array[0] +"\">"+ client_groups_array[0] +"</option>");
                $("select#client_group").selectmenu('enable').selectmenu('refresh', true);
              }
            } else {
              var client_groups_options = "<option value=\"\">- All Client Groups -</option>";
              $.each(client_groups_array, function(i,v){
                client_groups_options = client_groups_options + "<option value=\""+ v +"\">"+ v +"</option>";
              });
              $("select#client_group").html(client_groups_options);
              $("select#client_group").selectmenu('enable').selectmenu('refresh', true);
            }
            break;
        }
      }
      filters = app.sitesFilters((function(){
        var ret = {};
        if ("" !== $("select#client").val()){
          ret = $.extend(ret, {client: $("select#client").val()});
        }
        if ("" !== $("select#client_group").val()){
          ret = $.extend(ret, {client_group: $("select#client_group").val()});
        }
        return ret;
      })());

      var sites_arr = $.grep(self.data, function(st, ind){
        return (
            (undefined === filters.client)
                || (undefined !== filters.client && undefined === filters.client_group
                && filters.client == st.client )
                || (undefined !== filters.client && undefined !== filters.client_group
                && filters.client == st.client && filters.client_group == st.client_group )
            )
      });
      var out;
      if (sites_arr.length>0){
        out = ["<li data-role=\"list-divider\" role=\"heading\">Sites ("+ sites_arr.length +")</li>"];
        for(var i=0, l=sites_arr.length; i<l; i++) {
          out[i+1] = "<li class=\"inspectable\">" +
            "<div class=\"points\">" +
              sites_arr[i].site +"<br />" +
              "<span class=\"address\">"+ sites_arr[i].address +"</span><br />" +
              "<span class=\"time\">Client: "+ sites_arr[i].client +" / "+ sites_arr[i].client_group +"</span>" +
            "</div>" +
            "<div class=\"box_rightcnt bottom\">" +
              "<button class=\"show_details\" data-siteid=\""+sites_arr[i].site_id+"\">Site Details</button>" +
              "<a class=\"button\" data-role=\"button\" href=\"geo:"+
                app.lastLocation.lat +","+app.lastLocation.lng+"?q="+sites_arr[i].circle_latitude+","+sites_arr[i].circle_longitude+
                "\">See Route</a>" +
            "</div>" +
            "<div style=\"clear:both;\"></div>" +
          "</li>";
        }
        out.push("</ul>");

        $("ul#sites_content").html(out.join("")).show(1, function(){
          $("ul#sites_content").trigger("create").listview('refresh');
        });
      } else {
        out = ["<li data-role=\"list-divider\" role=\"heading\">Sites (0)</li>", "<li class=\"inspectable\"> - </li>"];
        $("ul#sites_content").html(out.join("")).show(1, function(){
          $("ul#sites_content").trigger("create").listview('refresh');
        });
      }
    });

    this.el.on('click', '.show_details', function(event){
      app.route({
        toPage: window.location.href + "#siteinfo:" + $(event.currentTarget).attr("data-siteid")
      });
    });

  };
  this.initialize();

};

Handlebars.registerHelper('ListOfAvailiableSitesContent', function() {
  var out = [],
      self = this,
      sites_to_display = $.grep(self.sites, function(st, ind){
        return (
            (undefined === self.filters) || (undefined === self.filters.client)
                || (undefined !== self.filters.client && undefined === self.filters.client_group
                      && self.filters.client == st.client )
                || (undefined !== self.filters.client && undefined !== self.filters.client_group
                      && self.filters.client == st.client && self.filters.client_group == st.client_group )
            )
      }),
      clients = (function(){
        var arr = [];
        $.each(self.sites, function(i, value){
          if ($.inArray(value.client, arr) < 0){
            arr.push(value.client);
          }
        });
        return arr;
      })(),
      client_groups = (function(filters){
        var arr = [];
        if (undefined !== filters && undefined !== filters.client){
          $.each(self.sites, function(i, value){
            if ( filters.client == value.client && $.inArray(value.client_group, arr) < 0){
              arr.push(value.client_group);
            }
          });
        }

        return arr;
      })(self.filters);

  out.push("<select name=\"client\" id=\"client\">");
  out.push("<option value=\"\">- All Clients -</option>");
  $.each(clients, function( index, value ) {
    out.push("<option value=\"" + value + "\""+
        ((undefined !== self.filters && undefined !== self.filters.client && value === self.filters.client )
            ?' selected="selected"'
            :'') +
        ">" + value + "</option>");
  });
  out.push("</select>");

  if ( client_groups.length === 0 ){
    out.push("<select disabled=\"disabled\" name=\"client_group\" id=\"client_group\">");
    out.push("<option value=\"\">- All Client Groups -</option>");
  } else if ( 1 == client_groups.length && "null" == client_groups[0]) {
    out.push("<select name=\"client_group\" id=\"client_group\">");
    out.push("<option value=\"null\"></option>");
  } else if (( client_groups.length >= 1)){
    out.push("<select name=\"client_group\" id=\"client_group\">");
    out.push("<option value=\"\">- All Client Groups -</option>");
    $.each(client_groups, function( index, value ) {
      out.push("<option value=\"" + value + "\""+
          ((undefined !== self.filters && undefined !== self.filters.client_group && value === self.filters.client_group )
              ?' selected="selected"'
              :'') +
          ">" + value + "</option>");
    });
  }
  out.push("</select>");

  out.push("<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\" id=\"sites_content\">");
  if (sites_to_display.length > 0) {
    out.push("<li data-role=\"list-divider\" role=\"heading\">Sites ("+ sites_to_display.length +")</li>");
    $.each(sites_to_display, function(i,v){
      out.push("<li class=\"inspectable\">" +
        "<div class=\"points\">" +
          v.site +"<br />" +
          "<span class=\"address\">"+ v.address +"</span><br />" +
          "<span class=\"time\">Client: "+ v.client +" / "+ v.client_group +"</span>" +
        "</div>" +
        "<div class=\"box_rightcnt bottom\">" +
          "<button class=\"show_details\" data-siteid=\""+v.site_id+"\">Site Details</button>" +
          "<a class=\"button\" data-role=\"button\" href=\"geo:"+
            app.lastLocation.lat +","+app.lastLocation.lng+"?q="+v.circle_latitude+","+v.circle_longitude+
            "\">See Route</a>" +
        "</div>" +
        "<div style=\"clear:both;\"></div>" +
     "</li>");
    });
  } else {
    out.push("<li data-role=\"list-divider\" role=\"heading\">Sites (0)</li>");
    out.push("<li class=\"inspectable\"> - </li>");
  }
  out.push("</ul>");

  return new Handlebars.SafeString(out.join(""));
});

SitesListView.template = Handlebars.compile($("#siteslist-tpl").html());