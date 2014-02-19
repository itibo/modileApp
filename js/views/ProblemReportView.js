var ProblemReportView = function(){

  this.render = function() {
    this.el.html(ProblemReportView.template());
    return this;
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div/>');
  };
  this.initialize();
}

ProblemReportView.template = Handlebars.compile($("#problem-report-tpl").html());