var InspectionView = function(data) {
  this.data = data || [];
  this.comment_maxlength = 2000;

  this.render = function() {
    var self = this;
    var context = {};
    var job_inspect_container = app.getJobInspectionContainer();

    context.userInfo = app.getUserInfo();
    var site = (function(){
      var obj = {};

      $.each(app.sitesToInspect(), function(i,v){
        if (job_inspect_container.site_id == v.site_id && job_inspect_container.job_id == v.job_id){
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
        commentVal: (job_inspect_container.comment) ? job_inspect_container.comment : "",
        comment_maxlength: self.comment_maxlength
      },
      site: site
    });
    this.el.html(InspectionView.template(context));
    return this;
  };

  this.validateAndSubmit = function(callback){
    var self = this,
        allow_to_submit = (function(){
          var tmp = true;
          $.each($("input", $(self.el)), function(i, elm){
            if ( ( null == $(elm).val() || "" == $(elm).val() ) && "estimated_question" != $(elm).attr("id") ){
              tmp = false;
              return false;
            }
          });
          return tmp;
        })();

    if (allow_to_submit){
      var submit_data = app.getJobInspectionContainer();

      if (submit_data.comment && submit_data.comment.length > self.comment_maxlength){
        navigator.notification.alert(
            "Comment is too large. Please correct it.",         // message
            function(){                       //callback
              // do nothing
            },
            "Inspection submission",          // title
            'Ok'                              // buttonName
        );
      } else {
        navigator.notification.confirm('Do you want to submit the inspection?',
            function(buttonIndex){
              if(2 == buttonIndex){
                submit_data = app.setJobInspectionContainer($.extend(submit_data, {
                  status: "pre_submitting",
                  completed_at: (new Date()).toUTCString()
                }));

                var get_position_arr = function(pos){
                  return [{
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    acc: pos.coords.accuracy,
                    time: (new Date(pos.timestamp)).toUTCString(),
                    job_id: submit_data.job_id,
                    site_id: submit_data.site_id
                  }];
                };

                var position_callback = function(arg){
                  submit_data.status = "submitting";
                  if ( "undefined" == typeof arg.code ){
                    submit_data.submitting_position = get_position_arr(arg);
                    submit_data.completed_at = (new Date(arg.timestamp)).toUTCString();
                  }
                  submit_data = app.setJobInspectionContainer(submit_data);
                  setTimeout(function(){
                    app.check();
                  }, 0);
                };

                setTimeout(function(){
                  navigator.geolocation.getCurrentPosition(position_callback, position_callback, {timeout:30000, maximumAge: 0, enableHighAccuracy: false});
                  callback();
                  app.route({
                    toPage: window.location.href + "#welcome"
                  });
                }, 0);
              } else {
                callback();
              }
            },
            'Inspection submission',
            ['No','Yes']
        );
      }
    } else {
      navigator.notification.alert(
        "The inspection is not completed. Please set rate on all items.",         // message
        function(){                       //callback
          callback();
        },
        "Inspection submission",          // title
        'Ok'                              // buttonName
      );
    }
  };

  this.cancelInspection = function(callback){
    navigator.notification.confirm("Do you want to cancel this inspection?",
      function(buttonIndex){
        if(2 == buttonIndex){
          app.cancell_inspection(true);
          app.setJobInspectionContainer(false);
          if ("function" === typeof callback) callback();
          app.route({
            toPage: window.location.href + "#my_jobs"
          });
        } else {
          if ("function" === typeof callback) callback();
        }
      },
      "Inspection cancelling",
      ['No','Yes']
    );
  };

  this.update_ls = function(elm, popup){
    // update local storage by the mark
    popup = popup || $(".pop_up");
    var tmp = {},
        saved_inspection = app.getJobInspectionContainer(),
        new_mark = $(elm).attr("data-value"),
        estimated_question_id = $("input#estimated_question", popup).val(),
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
    $(".number", changed_raw).html("<span>" + ((new_mark === "0")? "N/A": new_mark ) + "</span>");
    if (new_mark != ""){
      if(0 == new_mark){
        $(".number", changed_raw).addClass("na");
      } else {
        $(".number", changed_raw).removeClass("na");
      }
      $(changed_raw).addClass("active").trigger("create");
    } else {
      $(".number", changed_raw).removeClass("na");
      $(changed_raw).removeClass("active").trigger("create");
    }
  };

  this.close_and_clean_popup = function(){
    var $popup = $(".pop_up");
    $("a.clear", $popup).removeClass("disabled");
    $("#estimated_question", $popup).val("");
    $("h2", $popup).html();
    $(".popup-overlay").remove();
    $popup.css("visibility", "hidden");
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
    this.el.on('click', '.manage_area button#submit', function(e){
      e.preventDefault();
      if (!e.currentTarget.clicked) {
        e.currentTarget.clicked = true;
        self.validateAndSubmit.call(self, function(){
          e.currentTarget.clicked = false;
        });
      }
    });
    this.el.on('click', 'div[data-role=header] a', function(event){
      event.preventDefault();
      event.stopPropagation();
        self.close_and_clean_popup.call(self);
        self.cancelInspection.call(self);
    });

    this.el.on('click', '.pop_up .close', function(event){
      event.preventDefault();
      event.stopPropagation();
      self.close_and_clean_popup.call(self);
    });

    this.el.on('input propertychange', 'textarea#comment', function(event){
      event.preventDefault();
      $(".characterscountdown>strong", $(event.delegateTarget)).html($(event.currentTarget).val().length);
      if ($(event.currentTarget).val().length > self.comment_maxlength){
        $(".characterscountdown>strong", $(event.delegateTarget)).addClass("error");
      } else {
        $(".characterscountdown>strong", $(event.delegateTarget)).removeClass("error");
      }
      app.setJobInspectionContainer($.extend(app.getJobInspectionContainer(), {comment: $(event.currentTarget).val()}));
    });

    this.el.on('click', '.pop_up .popup_content a, .pop_up a.clear', function(event){
      event.preventDefault();
      event.stopPropagation();
      if (!$(event.currentTarget).hasClass('disabled')){
        self.update_ls.call(self, $(event.currentTarget));
        self.close_and_clean_popup.call(self);
      }
    });

    this.el.on('click', '.block>a', function(event){
      event.preventDefault();

      var clicked_block = $(event.currentTarget).parent(".block");
      var $popup = $(".pop_up");
      var $overlay = $("<div />", {
        class: "popup-overlay"
      }).on("click", function(e){
        e.preventDefault();
        self.close_and_clean_popup.call(self);
      });

      if ($("input", clicked_block).val() == ""){
        $(".clear", $popup).addClass("disabled");
      }
      $("input[type=hidden]", $popup).val($("input", clicked_block).attr("id"));
      $("h2", $popup).html("<font>" + $("h2", $(clicked_block).parents("div[data-role=content]").eq(0)).text() + "</font><br />" + $("div", $(event.currentTarget)).text());
      $overlay.appendTo("body").trigger("create");

      $popup.css( "left",  Math.round( ($(window).width() - $popup.width())/2 ) );

      if ($popup.height() > ($(window).height() - 30)){
        $popup.css("top", $(document).scrollTop() + parseInt(25) + "px");
      } else {
        $popup.css("top", $(document).scrollTop() + Math.round(($(window).height() - $popup.height())/2) + "px");
      }

      $popup.css("visibility","visible");
    });
  };
  this.initialize();

}

Handlebars.registerHelper('checkListContent', function(container){
  var out = [];
  var _items = container.checkList,
      comment = container.commentVal,
      comment_maxlength = container.comment_maxlength || 2000;

  for(var i=0, l=_items.length; i<l; i++) {
    var devider = _items[i];
    //begin of section
    out.push("<div data-role=\"content\"><h2>" + devider.attr.item_group +"</h2>");
    for (var j=0, sl = devider.items.length; j<sl; j++){
      var question = devider.items[j];
      out.push("<div class=\"block" + ((question.saved_value)? " active":"") + "\">" +
          "<a class=\"btn-main\"><div data-role=\"button\">" + question.name + "</div></a>" +
          "<div class=\"number" + (typeof question.saved_value != "undefined" && question.saved_value == "0" ? " na":"") + "\" total-scores=\"" + parseInt(question.total_points) + "\"><span>" +
            (typeof question.saved_value != "undefined" ? ((question.saved_value == 0 )? "N/A": question.saved_value) : "") +
          "</span></div>" +
          "<input type=\"hidden\" id=\"" + question.item_id + "\" value=\"" + (typeof question.saved_value != "undefined" ? question.saved_value: "") + "\" />" +
        "</div>");
    }
    out.push("</div>");
    //end of section
  }
  //begin of textarea and submit
  out.push("<div data-role=\"content\">" +
      "<h3 class=\"mt0\">Notes <font>(optional):</font></h3>" +
      "<div class=\"characterscountdown\"><strong"+(comment.length>comment_maxlength ? " class=\"error\"" : "")+">"+
        comment.length +"</strong> of "+ comment_maxlength +"</div>" +
      "<div class=\"block-textarea\" style=\"clear: both;\">" +
        "<textarea id=\"comment\" name=\"comment\">" + comment + "</textarea>" +

      "</div>" +
/*      "<div class=\"block-submit\">" +
        "<input type=\"submit\" value=\"Submit\" />"+
      "</div>" +*/

      "<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>" +
        "<td width=\"24%\">&nbsp;</td>" +
        "<td class=\"green_btn\">" +
          "<button id=\"submit\">Submit</button>" +
        "</td>" +
        "<td width=\"24%\">&nbsp;</td>" +
      "</tr></table>" +
    "</div>");
  //end textarea and submit
  return new Handlebars.SafeString(out.join(""));
});

InspectionView.template = Handlebars.compile($("#inspection-tpl").html());