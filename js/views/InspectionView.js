var InspectionView = function(data) {
  this.data = data || [];

  this.render = function() {
    var self = this;
    var context = {};
    var job_inspect_container = app.getJobInspectionContainer();

    context.userInfo = app.getUserInfo();
    var site = (function(){
      var obj = {};

      $.each(app.sitesToInspect(), function(i,v){
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
            if ( ( null == $(elm).val() || "" == $(elm).val() ) && "estimated_question" != $(elm).attr("id") ){
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
            var submit_data = app.getJobInspectionContainer();
            app.setJobInspectionContainer($.extend(submit_data, {status: "pre_submitting"}));

            var get_position_arr = function(pos){
              return [{
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                acc: pos.coords.accuracy,
                time: (new Date()).toUTCString(),
                job_id: submit_data.job_id,
                site_id: submit_data.site_id
              }];
            };

            var position_callback = function(arg){
              submit_data.status = "submitting";
              submit_data.completed_at = (submit_data.completed_at)? submit_data.completed_at: (new Date()).toUTCString();
              if ( "undefined" == typeof arg.code ){
                submit_data.submitting_position = get_position_arr(arg);
              }
              app.setJobInspectionContainer(submit_data);
              app.check();

            };

            setTimeout(function(){
              navigator.geolocation.getCurrentPosition(position_callback, position_callback, {timeout:30000, maximumAge: 0});
              app.route({
                toPage: window.location.href + "#welcome"
              });
            }, 0);
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
          app.cancell_inspection(true);
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
    $("input[id=estimated_question][type=hidden]", $popup).val("");
    $("h2", $popup).html();
    $(".popup-overlay").remove();
    $popup.css("visibility", "hidden");
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div />');
    this.el.on('click', '.block-submit input[type=submit]', $.proxy(this.validateAndSubmit, self));
    this.el.on('click', 'div[data-role=header] a', function(event){
      event.preventDefault();
      self.close_and_clean_popup.call(self);
      self.cancelInspection.call(self);
    });

    this.el.on('click', '.pop_up .close', function(event){
      event.preventDefault();
      self.close_and_clean_popup.call(self);
    });

    this.el.on('change', '#comment', function(event){
      event.preventDefault();
      app.setJobInspectionContainer($.extend(app.getJobInspectionContainer(), {comment: $(event.currentTarget).val()}));
    });

    this.el.on('click', '.pop_up .popup_content a, .pop_up a.clear', function(event){
      event.preventDefault();
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
        $("a.clear", $popup).addClass("disabled");
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
        "<div class=\"block-textarea\">" +
          "<textarea id=\"comment\" name=\"comment\">" + comment + "</textarea>" +
        "</div>" +
        "<div class=\"block-submit\">" +
          "<input type=\"submit\" value=\"Submit\" />"+
        "</div>" +
      "</div>";
  //end textarea and submit
  return new Handlebars.SafeString(out);
});

InspectionView.template = Handlebars.compile($("#inspection-tpl").html());