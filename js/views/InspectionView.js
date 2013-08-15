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
        allow_to_submit = (function(){
          var tmp = true;
          $.each($("select", $(self.el)), function(i, elm){
            if (null == $(elm).val() || "" == $(elm).val()){
              tmp = false;
              return false;
            }
          });
          return tmp;
        })();

    if (allow_to_submit){
      navigator.notification.confirm('Do you want to submit the inspection?',
          function(buttonIndex){
            if(2 == buttonIndex){
              self.submit_inspection();
            }
          },
          'Inspection submission',
          'No,Yes'
      );
    } else {
/*      navigator.notification.confirm('Inspection is not completed yet. Do you want to submit it anyway?',
          function(buttonIndex){
            if(2 == buttonIndex){
              self.submit_inspection();
            }
          },
          'Inspection is not completed!',
          'No,Yes'
      );*/
      navigator.notification.alert(
          "The inspection is not completed. Please set rate on all items.",         // message
          function(){                       //callback
            // do nothing
          },
          "Inspection submission",          // title
          'Ok'                              // buttonName
      );
    }
  };

  this.submit_inspection = function(){
    var self = this,
        submit_array = [];

    $.each($("select", $(self.el)), function(i, el){
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
    this.el.on('click', '.submit', $.proxy(this.validateAndSubmit, self));
    this.el.on('click', '#header a', function(event){
      event.preventDefault();
      self.cancelInspection.call(self);
    });

    this.el.on('change', '.select-box select', function(event){
      event.preventDefault();
      $(event.currentTarget).parent(".select-box").addClass("normal").trigger("create");
    });



//    this.el.on('click', '.select-box', function(event){
//      event.preventDefault();
//
////      $('select', $(event.currentTarget)).trigger('change');
//    });




/*    this.el.on('click', '.notes-checkbox', function(event){
      event.preventDefault();
      var elm = $(event.currentTarget);
      var input = elm.find("input").eq(0);
      if (!input.attr("checked")){
        elm.css("background-position","-31px 0px");
        input.attr("checked", true);
      } else {
        elm.css("background-position","0 0");
        input.attr("checked", false);
      }
    });*/
  };
  this.initialize();

}

Handlebars.registerHelper('checkListContent', function(items) {

  var translate = {
    0: "&nbsp;&ensp;&nbsp;0 - N/A",
    1: "&nbsp;&ensp;&nbsp;1 - POOR (BELOW 65%)",
    2: "&nbsp;&ensp;&nbsp;2 - FAIR (BETWEEN 65% AND 75%)",
    3: "&nbsp;&ensp;&nbsp;3 - AVERAGE (BETWEEN 75% AND 85%)",
    4: "&nbsp;&ensp;&nbsp;4 - GOOD (BETWEEN 85% AND 95%)",
    5: "&nbsp;&ensp;&nbsp;5 - EXCELLENT (95% OR GREATER)"
  };
  var out = "";
  for(var i=0, l=items.length; i<l; i++) {
    var devider = items[i];
    //begin of section
    out = out + "<div class=\"section\"><h2>" + devider.attr.subject_group +"</h2>";
    for (var j=0, sl = devider.subjects.length; j<sl; j++){
      var question = devider.subjects[j];
      out = out + "<div class=\"select-box\">" +
          "<p>" + question.name + "</p>" +
          "<select width=\"50\" style=\"float:right; width: 50px;\" id=\"" + question.subject_id + "\"" + " name=\"" + question.subject_id + "\" data-role=\"none\">"+
          "<option selected=\"selected\" disabled=\"disabled\" value=\"\"></option>";
      for (var mark=0, max_mark = parseInt(question.total_points); mark <= max_mark; mark++){
        out = out + "<option value=\"" + mark + "\">"+ translate[mark] + "</option>";
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
/*            "<span class=\"notes-checkbox\"><input type=\"checkbox\" value=\"urgent\"></span>urgent" +*/
          "</div>" +
          "<textarea rows=\"10\" cols=\"45\" name=\"comment\" id=\"comment\" data-role=\"none\"></textarea>" +
        "</div>" +
      "</div>" +
      "<div class=\"submit\">" +
        "<input type=\"button\" value=\"Submit\" data-role=\"none\">" +
        "<span>Submit</span>" +
      "</div>";
  //end textarea and submit
  return new Handlebars.SafeString(out);
});

/*
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
*/
InspectionView.template = Handlebars.compile($("#inspection-tpl").html());