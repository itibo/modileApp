var SitesListView = function(data) {
  this.data = data || [];

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
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
  };
  this.initialize();

}

Handlebars.registerHelper('ListOfAvailiableSitesContent', function(items) {
  var out = "";
  if (items.length>0){
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">" +
        "<li data-role=\"list-divider\" role=\"heading\">The following sites are assigned to you:</li>";
    for(var i=0, l=items.length; i<l; i++) {
      out = out + "<li>" + items[i].site  + " (" + items[i].address + ") " +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: " + ((items[i].last_inspection)? items[i].last_inspection : "never") + "</span>" +
          "</li>";
    }
  } else {
    out = out + "<p>There are no availiable sites assigned to you.</p>";
  }
  return new Handlebars.SafeString(out);
});

SitesListView.template = Handlebars.compile($("#siteslist-tpl").html());