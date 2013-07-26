var MyJobsView = function() {

  this.render = function() {
    this.el.html(MyJobsView.template());
    return this;
  };

  this.initialize = function() {
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
  };

  this.initialize();

}

MyJobsView.template = Handlebars.compile($("#myjobs-tpl").html());