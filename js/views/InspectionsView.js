var InspectionsView = function() {

  this.render = function() {
    this.el.html(InspectionsView.template());
    return this;
  };

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
  };
  this.initialize();

}

InspectionsView.template = Handlebars.compile($("#inspections-tpl").html());