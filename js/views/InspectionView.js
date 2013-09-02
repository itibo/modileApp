var InspectionView = function(data) {
  this.data = data || [];

  this.render = function() {
    var self = this;
    var context = {};
    var job_inspect_container = app.getJobInspectionContainer();

    context.userInfo = app.getUserInfo();
    var site = (function(){
      var obj = {};

      $.each(app.jobsAvailiableToInspect, function(i,v){
        if (job_inspect_container.id == v.id){
          obj = v;
          return false;
        }
      });
      return obj;
    })();

    var populated_data = (function(defaults){
      var data = defaults;
      if ("pending" == job_inspect_container.status){
        $.each(defaults, function(i,v){
          $.each(v.items, function(k, quest){
            for(var j = 0, len = job_inspect_container.container.length; j < len; j++){
              var curr_obj_cont_id = Object.keys(job_inspect_container.container[j])[0];
              if (quest.item_id == curr_obj_cont_id){
                data[i]["items"][k]["saved_value"] = job_inspect_container.container[j][curr_obj_cont_id];
                break;
              }
            }
          });
        });
      }
      return data;
    })(self.data);
    context = $.extend(context, {
      controls: {
        checkList: populated_data,
        commentVal: (job_inspect_container.comment) ? job_inspect_container.comment : ""
      },
      site: site
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
            app.submitInspection();
          }
        },
        'Inspection submission',
        'No,Yes'
      );
    } else {
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

  this.cancelInspection = function(){
    navigator.notification.confirm("Do you want to cancel this inspection?",
      function(buttonIndex){
        if(2 == buttonIndex){
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

  this.update_ls = function(elm, popup){
    // update local storage by the mark
    var tmp = {},
        saved_inspection = app.getJobInspectionContainer(),
        new_mark = $(elm).attr("data-value"),
        estimated_question_id = $("input#ectimated_question", popup).val(),
        changed_raw = $("input[type=hidden][id="+estimated_question_id+"]").parent(".block");

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

    $("input", changed_raw).val(new_mark);
    $(".number span", changed_raw).html((new_mark == 0)? "N/A": new_mark);
    if (new_mark != ""){
      $(changed_raw).addClass("active").trigger("create");
    } else {
      $(changed_raw).removeClass("active").trigger("create");
    }
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
    this.el.on('click', '.block-submit input[type=submit]', $.proxy(this.validateAndSubmit, self));
    this.el.on('click', 'div[data-role=header] a', function(event){
      event.preventDefault();
      $("#popup, .popup-overlay").remove();
      self.cancelInspection.call(self);
    });

    this.el.on('change', '#comment', function(event){
      event.preventDefault();
      app.setJobInspectionContainer($.extend(app.getJobInspectionContainer(), {comment: $(event.currentTarget).val()}));
    });

    this.el.on('click', '.block>a', function(event){
      event.preventDefault();

      var clicked_block = $(event.currentTarget).parent(".block");

      var translate = {
        0: "N/A",
        1: "1 - POOR <font>(</font>Below 65%<font>)</font>",
        2: "2 - FAIR <font>(</font>65% to 75%<font>)</font>",
        3: "3 - AVERAGE <font>(</font>75% to 85%<font>)</font>",
        4: "4 - GOOD <font>(</font>85% to 95%<font>)</font>",
        5: "5 - EXCELLENT <font>(</font>95% or Greater<font>)</font>"
      };

      var $popup = $("<div />").popup({
        overlayTheme : "a",
        positionTo: "window"
      });

      $('<input />',{
        type:'hidden',
        id:'ectimated_question',
        value: $("input", clicked_block).attr("id")
      }).appendTo($popup);

      $('<a>',{
        text:'Clear Score (N/A)',
        href:'#',
        "data-role":"button",
        class: ($("input", clicked_block).val().length > 0 ) ? "clear": "clear ui-disabled"
      }).on("click", function(e){
        e.preventDefault();
        self.update_ls.call(self, $(e.currentTarget), $popup);
        $popup.popup("close");
        $popup.remove();
        return false;
      }).appendTo($popup);

      $('<a>',{
        text:'Close',
        href:'#',
        "data-role":"button",
        "data-theme": "a",
        "data-icon": "delete",
        "data-iconpos": "notext",
        class: "ui-btn-right close-btn"
      }).on("click", function(e){
        e.preventDefault();
        $popup.popup("close");
        $popup.remove();
        return false;
      }).appendTo($popup);

      $('<h2 />').append("<font>" + $("h2", $(clicked_block).parents("div[data-role=content]").eq(0)).html() + "</font><br />" + $("div", $(event.currentTarget)).html()).appendTo($popup);

      for(var i = 0, l = parseInt($(".number", clicked_block).attr('total-scores')); i<=l; i++){
        $('<a>',{
          href:'#',
          "data-role":"button",
          "data-value": i
        }).html(translate[i]).on("click", function(e){
          e.preventDefault();
          self.update_ls.call(self, $(e.currentTarget), $popup);
          $popup.popup("close");
          $popup.remove();
          return false;
        }).appendTo($popup);
      }

      $popup.popup("open").trigger("create");
    });
  };
  this.initialize();

}


// третья верстка
Handlebars.registerHelper('checkListContent', function(container){
  var out = "";
  var _items = container.checkList;
  var comment = container.commentVal;
  for(var i=0, l=_items.length; i<l; i++) {
    var devider = _items[i];
    //begin of section
    out = out + "<div data-role=\"content\"><h2>" + devider.attr.item_group +"</h2>";
    for (var j=0, sl = devider.items.length; j<sl; j++){
      var question = devider.items[j];
      out = out + "<div class=\"block" + ((question.saved_value)? " active":"") + "\">" +
          "<a class=\"btn-main\"><div data-role=\"button\">" + question.name + "</div></a>" +
          "<div class=\"number" + (typeof question.saved_value != "undefined" && question.saved_value == "0" ? " na":"") + "\" total-scores=\"" + parseInt(question.total_points) + "\"><span>" +
          (typeof question.saved_value != "undefined" ? ((question.saved_value == 0 )? "N/A": question.saved_value) : "") +
          "</span></div>" +
          "<input type=\"hidden\" id=\"" + question.item_id + "\" value=\"" + (typeof question.saved_value != "undefined" ? question.saved_value: "") + "\" />" +
          "</div>";
    }
    out = out + "</div>";
    //end of section
  }
  //begin of textarea and submit
  out = out +
      "<div data-role=\"content\">" +
      "<h3>Notes <br /><font>(optional):</font></h3>" +
        "<div class=\"block-submit\">" +
          "<textarea id=\"comment\" name=\"comment\">" + comment + "</textarea>" +
          "<input type=\"submit\" value=\"Submit\" />"+
        "</div>" +
      "</div>";
  //end textarea and submit
  return new Handlebars.SafeString(out);
});

InspectionView.template = Handlebars.compile($("#inspection-tpl").html());