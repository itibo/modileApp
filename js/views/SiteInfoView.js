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
        "Contact Name: <span>"+(this.common_info.contact_name || "-")+"</span><br />" +
        "Contact Phone: <span>"+(this.common_info.contact_phone || "-")+"</span>"+ ((this.common_info.contact_phone)? ("&nbsp;<a class=\"dial\" href=\"tel:"+this.common_info.contact_phone+"\"><span>Dial</span></a>") : "") +"<br />" +
        "Email: <span>"+(this.common_info.email || "-")+"</span>" +
      "</p>" +
    "</div>";
  }
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('StaffingPlanContent', function(){
  var out = "<ul data-role=\"listview\" data-inset=\"true\" class=\"week\">" +
      "<li data-role=\"list-divider\" role=\"heading\">Staffing plan</li>";

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
            "<span class=\"address\">Time shift: "+ staff_plan.begin_at +" - "+ staff_plan.end_at +"</span></li>";
      });
      out = out +"<li role=\"heading\"><h2>"+ (function(str){
        return str.charAt(0).toUpperCase() + str.slice(1);
      })(day_obj.day_of_week) +"</h2></li>" + day_part;
    });
  } else {
    out = out +"<li class=\"boxcntone\"> - </li>";
  }
  out = out +"</ul>";
  return new Handlebars.SafeString(out);
});

SiteInfoView.template = Handlebars.compile($("#siteInfo-tpl").html());


