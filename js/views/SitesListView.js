var SitesListView = function(data) {
  this.data = data || [];
  this.reordered_sites = {};

  this.render = function() {
    var self = this,
        context = {};
    context.userInfo = app.getUserInfo();
    context = $.extend(context, {
      sites: self.data
    });
    this.el.html(SitesListView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');

    this.el.on("change", "select[name^=client]", function(e){
      e.preventDefault();
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
            $("select#client_group").html("<option value=\"\">- Select Client Group -</option>");
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
              var client_groups_options = "<option value=\"\">- Select Client Group -</option>";
              $.each(client_groups_array, function(i,v){
                client_groups_options = client_groups_options + "<option value=\""+ v +"\">"+ v +"</option>";
              });
              $("select#client_group").html(client_groups_options);
              $("select#client_group").selectmenu('enable').selectmenu('refresh', true);
            }
            break;
        }
      }

      if ($("select#client_group").val().length>0){
        var sites_arr = self.reordered_sites[$("select#client").val()][$("select#client_group").val()],
            out = "";
//        out = out + "<li data-role=\"list-divider\" role=\"heading\">The following sites are assigned to you:</li>";
        for(var i=0, l=sites_arr.length; i<l; i++) {
          out = out + "<li class=\"inspectable\">" +
              "<a href=\"#siteinfo:"+sites_arr[i].site_id +"\">" +
                "<div class=\"syncreq\" style=\"color:black;\">details</div>" +
                  "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\"/>" +
                  "<div class=\"points\">" +
                    sites_arr[i].site +"<br />" +
                    "<span class=\"address\">"+ sites_arr[i].address +"</span><br />" +
                    "<span class=\"time\">Client: <strong>"+ sites_arr[i].client +" / "+ sites_arr[i].client_group +"</strong></span>" +
                  "</div>" +
              "</a>"+
            "</li>";
        }
        out = out + "</ul>";

        $("ul#sites_content").html(out).show(1, function(){
          $("ul#sites_content").listview('refresh');
        });
      } else {
        $("ul#sites_content").hide(1, function(){
          $("ul#sites_content").html("&nbsp;");
        });
      }
    });
  };
  this.initialize();

}

Handlebars.registerHelper('ListOfAvailiableSitesContent', function(items) {
  var out = "",
      clients = (function(){
        var arr = [];
        $.each(items, function(i, value){
          if ($.inArray(value.client, arr) < 0){
            arr.push(value.client);
          }
        });
        return arr;
      })();

  out = out + "<select name=\"client\" id=\"client\">";
  out = out + "<option value=\"\">- Select Client -</option>";
  $.each(clients, function( index, value ) {
    out = out + "<option value=\"" + value + "\">" + value + "</option>";
  });
  out = out + "</select>";
  out = out + "<select disabled=\"disabled\" name=\"client_group\" id=\"client_group\"><option value=\"\">- Select Client Group -</option></select>";
  out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\" id=\"sites_content\" style=\"display:none;\"></ul>";
  return new Handlebars.SafeString(out);
});

SitesListView.template = Handlebars.compile($("#siteslist-tpl").html());