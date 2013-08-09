var InspectionView = function(data) {
  this.data = data || [];

  this.render = function() {
    var self = this;
    var context = {};
    context.userInfo = app.userInfo;
    context = $.extend(context, {
      checkList: self.data
    });
//    alert(JSON.stringify(context.checkList));
    this.el.html(InspectionView.template(context));
    return this;
  };

  this.submit_inspection = function(){
    app.inspectionJobID = false;
    alert("inspection submitted");
    app.route();
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');
    this.el.on('click', 'a#submit_inspection', $.proxy(this.submit_inspection, self));

  };
  this.initialize();

}

Handlebars.registerHelper('checkListContent', function(items) {

  var out = "";
  for(var i=0, l=items.length; i<l; i++) {
    var devider = items[i];
    var devider_clean = devider.attr.subject_group.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '_').toLowerCase();
    out = out + "<li data-role=\"list-divider\" role=\"heading\">" + devider.attr.subject_group +"</li>";
    for (var j=0, sl = devider.subjects.length; j<sl; j++){
      var question = devider.subjects[j];
      var question_name_clean = question.name.replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '_').toLowerCase();
      out = out + "<li><div data-role=\"fieldcontain\">" +
          "<label for=\"" + devider_clean + "_" + question_name_clean + "\">" + question.name + "</label>" +
          "<select id=\"" + devider_clean + "_" + question_name_clean + "\"" +
          " name=\"" + devider_clean + "[" + question_name_clean + "]\">"+
          "<option value=\"\"></option>";
      for (var mark=0, max_mark = parseInt(question.total_points); mark <= max_mark; mark++){
        out = out + "<option value=\"" + mark + "\">"+ mark + "</option>";
      }
      out = out + "</select></div></li>";
    }
  }
  return new Handlebars.SafeString(out);
});

InspectionView.template = Handlebars.compile($("#inspection-tpl").html());