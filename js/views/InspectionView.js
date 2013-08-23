var InspectionView = function(data, checklist_id) {
  this.data = data || [];
  this.checklist_id = checklist_id || "";

  this.render = function() {
    var self = this;
    var context = {};
    context.userInfo = app.getUserInfo();
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

    var populated_data = (function(defaults){
      var data = defaults;
      var job_inspect_container = app.getJobInspectionContainer();
      if (app.inspectionJobID == job_inspect_container.id && "pending" == job_inspect_container.status){
        $.each(defaults, function(i,v){
          $.each(v.subjects, function(k, quest){
            for(var j = 0, len = job_inspect_container.container.length; j < len; j++){
              var curr_obj_cont_id = Object.keys(job_inspect_container.container[j])[0];
              if (quest.subject_id == curr_obj_cont_id){
                data[i]["subjects"][k]["saved_value"] = job_inspect_container.container[j][curr_obj_cont_id];
                break;
              }
            }
          });
        });
      }
      return data;
    })(self.data);
    context = $.extend(context, {
      checkList: populated_data,
      location: location
    });
    this.el.html(InspectionView.template(context));
    return this;
  };

  this.validateAndSubmit = function(){
    var self = this,
        allow_to_submit = (function(){
          var tmp = true;
          $.each($("input", $(self.el)), function(i, elm){
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
        job_inspect_container = app.getJobInspectionContainer();

    var submit_data = $.extend({
        checklist_id: self.checklist_id,
        comment: $('textarea#comment').val()
      }, { list: job_inspect_container.container });
    app.submitInspection(submit_data);
  };

  this.cancelInspection = function(){
    navigator.notification.confirm("Do you want to cancel this inspection?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.inspectionJobID = false;
          app.setJobInspectionContainer(false);
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
      $("#popup, .popup-overlay").remove();
      self.cancelInspection.call(self);
    });

    // третья верстка
    this.el.on('click', '.select-box', function(event){
      event.preventDefault();
      $("#popup, .popup-overlay").remove();

      var translate = {
        0: "0 - N/A",
        1: "1 - POOR (BELOW 65%)",
        2: "2 - FAIR (BETWEEN 65% AND 75%)",
        3: "3 - AVERAGE (BETWEEN 75% AND 85%)",
        4: "4 - GOOD (BETWEEN 85% AND 95%)",
        5: "5 - EXCELLENT (95% OR GREATER)"
      };

      var popup_overlay = $("<div class=\"popup-overlay\"></div>");
      var popup = $("<div id=\"popup\"><a href=\"#\" class=\"close-btn\">Close</a></div>");
      var str = "<div class=\"popup_content\">"+
          "<p>" + $("div:first-child", $(event.currentTarget)).html() +
          "</p><input type=\"hidden\" id=\"ectimated_question\" value=\"" +
          $("input", $(event.currentTarget)).attr("id") + "\">" + "<ul><li>" +
          (($("input", $(event.currentTarget)).val().length > 0 ) ? "<a data-value=\"\" href=\"#\">" :"") +
          "Clear" + (($("input", $(event.currentTarget)).val().length > 0 ) ? "</a></li>" :"</li>");

      for(var i = 0, l = parseInt($(".mark", $(event.currentTarget)).attr('total-scores')); i<=l; i++){
        str = str + "<li><a data-value=\"" + i + "\" href=\"#\">" + translate[i] + "</a></li>";
      }
      str = str + "</ul></div>";
      $(popup).append(str);

      $(popup_overlay).appendTo("body").trigger("create");
      $(popup).appendTo("body").trigger("create");

      var popup_width = (function(){
        var max_width = 0;
        $.each($("#popup li a"), function(i,v){
          if ($(v).width() > max_width) {
            max_width = $(v).width();
          }
        });
        return max_width;
      })();

      if (popup_width > $(window).width() ){
        popup_width = $(window).width();
      }
      $("#popup").width(popup_width);
      $("#popup").css( "left",  Math.round( ($(window).width() - popup_width)/2 ) );

      var popup_height = $("#popup .popup_content").height();

      if (popup_height> $(window).height()){
        popup_height = $(window).height();
      }
      $("#popup").height(popup_height);
      $("#popup").css( "top",  $(document).scrollTop() + Math.round(($(window).height() - popup_height)/2) + "px" );


      $("#popup").css("visibility", "visible");

      $("#popup a").unbind();

      $('a.close-btn, .popup-overlay').on('click', function(event){
        event.preventDefault();
        $("#popup, .popup-overlay").remove();
      });

      $('#popup li a').on('click', function(event){
        event.preventDefault();
        var tmp = {},
            saved_inspection = app.getJobInspectionContainer(),
            new_mark = $(event.currentTarget).attr("data-value"),
            estimated_question_id = $("input#ectimated_question", $(event.currentTarget).parents(".popup_content")).val(),
            changed_raw = $("input[type=hidden][id="+estimated_question_id+"]").parent(".select-box");

        if (saved_inspection.id == app.inspectionJobID){
          var update = false,
              index = 0;
          for(var i = 0, l = saved_inspection.container.length; i<l; i++){
            var curr_obj_cont_id = Object.keys(saved_inspection.container[i])[0];
            if (curr_obj_cont_id == estimated_question_id){
              update = true;
              index = i;
            }
          }

          tmp[estimated_question_id] = new_mark;
          if (update){
            if (new_mark != ""){
              saved_inspection.container[index] = tmp;
            } else {
              saved_inspection.container.splice( index, 1 );
            }
          } else {
            if (new_mark != ""){
              saved_inspection.container.push(tmp);
            }
          }
          app.setJobInspectionContainer(saved_inspection);
        }

        $("input", changed_raw).val(new_mark);
        $("span", changed_raw).html(new_mark);
        if (new_mark != ""){
          $(changed_raw).addClass("normal").trigger("create");
        } else {
          $(changed_raw).removeClass("normal").trigger("create");
        }
        $("#popup, .popup-overlay").remove();
      });

    });


/*
    // вторая верстка
    this.el.on('change', '.select-box select', function(event){
      event.preventDefault();

      var tmp = {},
          saved_inspection = app.getJobInspectionContainer();
      if (saved_inspection.id == app.inspectionJobID){
        var update = false,
            index = 0;
        for(var i = 0, l = saved_inspection.container.length; i<l; i++){
          if (saved_inspection.container[i].id == $(event.currentTarget).attr("id")){
            update = true;
            index = i;
          }
        }

        tmp[$(event.currentTarget).attr("id")] = $(event.currentTarget).val();
        if (update){
          saved_inspection.container[index] = tmp;
        } else {
          saved_inspection.container.push(tmp);
        }
        app.setJobInspectionContainer(saved_inspection);
      }
      $(event.currentTarget).parent(".select-box").addClass("normal").trigger("create");
    });*/


    /*
    // первая верстка
    this.el.on('click', '.notes-checkbox', function(event){
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


// третья верстка
Handlebars.registerHelper('checkListContent', function(items) {
  var out = "";
  for(var i=0, l=items.length; i<l; i++) {
    var devider = items[i];
    //begin of section
    out = out + "<div class=\"section\"><h2>" + devider.attr.subject_group +"</h2>";
    for (var j=0, sl = devider.subjects.length; j<sl; j++){
      var question = devider.subjects[j];
      out = out + "<div class=\"select-box" + ((question.saved_value)? " normal":"") + "\">" +
          "<div>" + question.name + "</div>" +
          "<span class=\"mark\" total-scores=\"" + parseInt(question.total_points) + "\">" + (typeof question.saved_value != "undefined" ? question.saved_value: "") + " </span>" +
          "<input type=\"hidden\" id=\"" + question.subject_id + "\" value=\"" + (typeof question.saved_value != "undefined" ? question.saved_value: "") + "\" />" +
          "</div>";
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
// вторая верстка
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
      out = out + "<div class=\"select-box" + ((question.saved_value)? " normal":"") + "\">" +
          "<p>" + question.name + "</p>" +
          "<select width=\"50\" style=\"float:right; width: 50px;\" id=\"" + question.subject_id + "\"" + " name=\"" + question.subject_id + "\" data-role=\"none\">"+
          "<option disabled=\"disabled\" value=\"\"></option>";
      for (var mark=0, max_mark = parseInt(question.total_points); mark <= max_mark; mark++){
        out = out + "<option value=\"" + mark + "\"" + ((question.saved_value && question.saved_value == mark)? " selected=\"selected\"":"") + ">"+ translate[mark] + "</option>";
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
});*/

/*
// первая верстка
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