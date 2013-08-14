var InspectionView = function(data, checklist_id) {
  this.data = data || [];
  this.checklist_id = checklist_id || "";

  this.render = function() {
    var self = this;
    var context = {};
    context.userInfo = app.userInfo;
    var location = (function(){
      var obj = {};
      $.each(app.jobsAvailiableToInspect, function(i,v){
        if (app.inspectionJobID == v.id){
          obj = v;
          return false;
        }
      });
      return obj;
    })();
    context = $.extend(context, {
      checkList: self.data,
      location: location
    });
//    alert(JSON.stringify(context));
    this.el.html(InspectionView.template(context));
    return this;
  };

  this.validateAndSubmit = function(){
    var self = this,
        allow_to_submit = true;

    $.each($("select, input", $(self.el)), function(i, el){
      if (""==$(el).val()){
        allow_to_submit = false;
      }
    });

    if (allow_to_submit){
      navigator.notification.confirm('Do you want to submit the inspection?',
          function(buttonIndex){
            if(2 == buttonIndex){
              self.submit_inspection();
            }
          },
          'Inspection submitting',
          'No,Yes'
      );
    } else {
      navigator.notification.confirm('Inspection is not completed yet. Do you want to submit it anyway?',
          function(buttonIndex){
            if(2 == buttonIndex){
              self.submit_inspection();
            }
          },
          'Inspection is not completed!',
          'No,Yes'
      );
    }
  };

  this.submit_inspection = function(){
    var self = this,
        submit_array = [];

    $.each($("select, input", $(self.el)), function(i, el){
      var tmp = {};
      tmp[$(el).attr("id")] = $(el).val();
      submit_array.push(tmp);
    });
    var submit_data = $.extend({
        checklist_id: self.checklist_id,
        comment: $('textarea#comment').val()
      }, { list: submit_array });
    app.submitInspection(submit_data);
  };

  this.cancelInspection = function(){
    navigator.notification.confirm("Do you want to cancel this inspection?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.inspectionJobID = false;
          app.route({
            toPage: window.location.href + "#my_jobs"
          });
        }
      },
      "Inspection cancelling",
      'No,Yes'
    );
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
//    this.el.on('click', '.submit', $.proxy(this.validateAndSubmit, self));
    this.el.on('click', 'a#submit_inspection', $.proxy(this.validateAndSubmit, self));
//    this.el.on('click', '#header a', function(event){
    this.el.on('click', 'div[data-role="header"]', function(event){
      event.preventDefault();
      self.cancelInspection.call(self);
    });
  };
  this.initialize();

}
/*
Handlebars.registerHelper('checkListContent', function(items) {

  var out = "";
  for(var i=0, l=items.length; i<l; i++) {
    var devider = items[i];
    //begin of section
    out = out + "<div class=\"section\"><h2>" + devider.attr.subject_group +"</h2>";
    for (var j=0, sl = devider.subjects.length; j<sl; j++){
      var question = devider.subjects[j];
      out = out + "<div class=\"select-box\">" +
          "<p>" + question.name + "</p>" +
          "<select id=\"" + question.subject_id + "\"" + " name=\"" + question.subject_id + "\">"+
          "<option selected=\"selected\" disabled=\"disabled\" value=\"\"></option>";
      for (var mark=0, max_mark = parseInt(question.total_points); mark <= max_mark; mark++){
        out = out + "<option value=\"" + mark + "\">"+ mark + "</option>";
      }
      out = out + "</select></div>";
    }
    out = out + "</div>";
    //end of section
  }
  //begin of textarea and submit
  out = out +
      "<div class=\"section\">" +
        "<div class=\"section-text\">" +
          "<div>" +
            "<p><b>Notes</b><br>(optional)</p>" +
            "<span class=\"notes-checkbox\"><input type=\"checkbox\" value=\"urgent\"></span>urgent" +
          "</div>" +
          "<textarea rows=\"10\" cols=\"45\" name=\"comment\" id=\"comment\"></textarea>" +
        "</div>" +
        "<div class=\"submit\">" +
          "<input type=\"button\" value=\"Submit\" >" +
          "<span>Submit</span>" +
        "</div>" +
      "</div>";
  //end textarea and submit
  return new Handlebars.SafeString(out);
});
*/
Handlebars.registerHelper('checkListContent', function(items) {

 var out = "";
 for(var i=0, l=items.length; i<l; i++) {
 var devider = items[i];
 out = out + "<li data-role=\"list-divider\" role=\"heading\">" + devider.attr.subject_group +"</li>";
 for (var j=0, sl = devider.subjects.length; j<sl; j++){
 var question = devider.subjects[j];
 out = out + "<li><div data-role=\"fieldcontain\">" +
 "<label for=\"" + question.subject_id + "\">" + question.name + "</label>" +
 "<select id=\"" + question.subject_id + "\"" + " name=\"" + question.subject_id + "\">"+
 "<option value=\"\"></option>";
 for (var mark=0, max_mark = parseInt(question.total_points); mark <= max_mark; mark++){
 out = out + "<option value=\"" + mark + "\""+ (mark == 1 ? " selected=\"selected\"":"") + ">"+ mark + "</option>";
 }
 out = out + "</select></div></li>";
 }
 }
 return new Handlebars.SafeString(out);
 });

InspectionView.template = Handlebars.compile($("#inspection-tpl").html());