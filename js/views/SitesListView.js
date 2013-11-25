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
    out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"withbrd\">";
    for(var i=0, l=items.length; i<l; i++) {
      out = out + "<li>" + items[i].site  + " - <span class=\"address\">" + items[i].address +
//          "<br />" +
//          "<span style=\"font-size: 0.8em;\">Last inspection: " + ((items[i].last_inspection)? items[i].last_inspection : "never") + "</span>" +
          "</span></li>";
    }
    out = out + "</ul>";
  } else {
    out = out + "<p>There are no sites assigned to you.</p>";
  }
  return new Handlebars.SafeString(out);
});

SitesListView.template = Handlebars.compile($("#siteslist-tpl").html());