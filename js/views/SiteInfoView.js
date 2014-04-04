var SiteInfoView = function(site_info) {
  this.common_info = site_info.common_info || {};
  this.staffing_plan = site_info.staffing_plan || {};
  this.back_to_page = site_info.back_to_page || "";

  this.render = function() {
    var context = $.extend(true, {}, {common_info: this.common_info, staffing_plan: this.staffing_plan});
    context.version = app.application_build + " " + app.application_version;
    context.back_to_page = this.back_to_page;
    this.el.html(SiteInfoView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this;
    // Define a div wrapper for the view. The div wrapper is used to attach events.
    this.el = $('<div/>');

    this.el.on('click', ".btn-back a", function(e){
      e.preventDefault();
      e.stopPropagation();
      app.backButton();
    });

  };
  this.initialize();

};

Handlebars.registerHelper('LocationDetailsContent', function(){
  var out = "";
  if (!$.isEmptyObject(this.common_info)){
    out = "<div class=\"location_details\">" +
      "<p><font><strong>"+ (this.common_info.site || "-") +"</strong><br /></font><br /><em>"+ (this.common_info.address || "-") +"</em></p>" +
      "<p class=\"add_info\">" +
        "Client: <span>"+(this.common_info.client || "-")+"</span><br />" +
        "Client group: <span>"+(this.common_info.client_group || "-")+"</span><br />" +
/*        "Contact Name: <span>"+(this.common_info.contact_name || "-")+"</span><br />" +
        "Contact Phone: <span>"+(this.common_info.contact_phone || "-")+"</span>"+ ((this.common_info.contact_phone)? ("&nbsp;<a class=\"dial\" href=\"tel:"+this.common_info.contact_phone+"\"><span>Dial</span></a>") : "") +"<br />" +
        "Email: <span>"+(this.common_info.email || "-")+"</span>" +*/
      "</p>" +
    "</div>";
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('StaffingPlanContent', function(){
  var total_week_minutes = 0,
      time_shift_out = function(staff_obj){

        var begin_at = staff_obj.begin_at.toLowerCase().replace(" ", ""),
            end_at = staff_obj.end_at.toLowerCase().replace(" ", ""),
            break_start = (undefined === staff_obj.break_start || "-" == staff_obj.break_start)
                ? false
                : staff_obj.break_start.toLowerCase().replace(" ", ""),
            break_end = (undefined === staff_obj.break_end || "-" == staff_obj.break_end)
                ? false
                : staff_obj.break_end.toLowerCase().replace(" ", "");

        var total_hours = (function(){

          if (undefined !== staff_obj.display_duration){
            total_week_minutes = total_week_minutes + (undefined === staff_obj.duration ? 0 : (staff_obj.duration/60));
            return "&nbsp;<span class=\"total_hours\">" + staff_obj.display_duration + "h" + "</span>";
          } else {
            var str = "",
                to_24h_time = function(time){
                  var _time = time.match(/^(\d+):(\d+)[\s]?(.+)$/),
                      out = {};
                  if(_time[3] == "pm" && Number(_time[1])<12){
                    out.h = Number(_time[1]) + 12;
                  } else if(_time[3] == "am" && Number(_time[1])==12) {
                    out.h = 0;
                  } else {
                    out.h = Number(_time[1]);
                  }
                  out.m = Number(_time[2]);
                  return out;
                };
            var _end_at = to_24h_time(end_at);
            var _begin_at = to_24h_time(begin_at);
            var diff = (_end_at.h*60 + _end_at.m) - (_begin_at.h*60 + _begin_at.m);
            var hours = Math.floor( diff / 60);
            var minutes = diff % 60;
            if (diff>0){
              total_week_minutes = total_week_minutes + diff;
            }
            str = ((hours>0)? hours :"0") + ":" + ((minutes>0)? ( (minutes<10 ? ("0" + minutes) : minutes)):"00") + "h";
            return "&nbsp(<span class=\"total_hours\">"+ str + "</span>";
          }
        })();

        return "<span class=\"address\">Time shift: "+ begin_at +" - "+ end_at + "</span><br />" +
            ((break_start || break_end)
                ? ("<span class=\"address\">Break: " + (break_start ? break_start : "-") + " - " + (break_end ? break_end : "-") +"</span><br />")
                : "") +
            "<span class=\"address\">Duration: " + total_hours +"</span></li>";
      },
      out = ["<ul data-role=\"listview\" data-inset=\"true\" class=\"week\">" +
      "<li data-role=\"list-divider\" role=\"heading\">Staffing plan</li>"];

  if (!$.isEmptyObject(this.staffing_plan)){
    $.each(this.staffing_plan.site_data, function(i, day_obj){
      var day_part = "";
      $.each(day_obj.day_data, function(ik, staff_plan){
        day_part = day_part + "<li class=\"boxcntone\">"+ staff_plan.first_name +" "+ staff_plan.last_name +
            "&nbsp;<span class=\"address\">(ID: "+(staff_plan.unique_id != null ? staff_plan.unique_id : "not set")+")</span><br/>" +
            "<span class=\"address\">"+(staff_plan.phone || "-")+"</span>" +
            ( (staff_plan.phone)
                ?("&nbsp;<div style=\"display: inline;\"><a class=\"dial\" href=\"tel:"+ staff_plan.phone +"\"><span>Dial</span></a></div><br/>")
                :"") +
            time_shift_out(staff_plan);
      });
      out.push("<li role=\"heading\"><h2>"+ (function(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
      })(day_obj.day_of_week) +"</h2></li>" + day_part);
    });
  } else {
    out.push("<li class=\"boxcntone\"> - </li>");
  }

  out.push("<li role=\"heading\"><div class=\"total hours\"><p>Total weekly hours: <span class=\"price\">"+ (function(all){
    var out = "",
        hours = Math.floor( all / 60),
        minutes = all % 60;
    out = ((hours>0)? (hours + "h"):"") + ((minutes>0)? ( " " + (minutes<10 ? ("0" + minutes) : minutes) + "m"):"");
    return out.length > 0 ? out : " - ";
  })(total_week_minutes) +"</span></p></div></li>");
  out.push("</ul>");
  return new Handlebars.SafeString(out.join(""));
});

SiteInfoView.template = Handlebars.compile($("#siteInfo-tpl").html());