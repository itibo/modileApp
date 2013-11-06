var SupplierView = function(){

  this.render = function(){
    var context = {},
        calculate_total = function(order){
          var tmp = 0;

          $.each(Object.keys(order.supply_order_categories), function(ie,ve){
            var category = order['supply_order_categories'][ve];
            $.each(Object.keys(category), function(ik, vk){
              var item = category[vk];
              if (item.amount > 0){
                tmp += parseFloat(item.price) * parseFloat(item.amount);
              }
            });
          });

          return (tmp == ~~tmp)? ~~tmp : tmp.toFixed(2);
        };
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.drafts = (function(){
      var return_arr = [],
          drafts = app.mySupplyOrdersDrafts();

      $.each(drafts, function(i,v){
        if (undefined != typeof (v.submit_status) && "submitting" == v.submit_status){
          // skip
        } else {
          return_arr.push({
            supply_order_id: v.supply_order_id,
            supply_order_name: v.supply_order_name,
            site_name: v.site_name,
            site_address: v.site_address,
            order_form: v.order_form,
            order_date: v.order_date,
            updated_at: v.updated_at,
            remaining_budget: v.remaining_budget,
            total: String(calculate_total(v))
          });
        }
      });
      return return_arr;
    })();

    context.submitted_orders = (function(){
      var return_arr = [],
          submitted_orders = app.myLastSubmittedOrders();
      $.each(submitted_orders, function(i,v){
        return_arr.push({
          supply_order_id: v.supply_order_id,
          supply_order_name: v.supply_order_name,
          site_name: v.site_name,
          site_address: v.site_address,
          order_form: v.order_form,
          order_date: v.order_date,
          updated_at: v.updated_at,
          total: calculate_total(v)
        });
      });
      return return_arr;
    })();

    this.el.html(SupplierView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div/>');

    this.el.on('click', 'button', function(event){
      event.preventDefault();
      app.route({
        toPage: window.location.href + "#order:new"
      });
    });

  };

  this.initialize();
}

Handlebars.registerHelper('DraftsOrderContent', function(drafts){
  var out = "",
      empty_list = true;
  out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"draft\">";
  out = out + "<li data-role=\"list-divider\" role=\"heading\">Draft Orders</li>";
  $.each(drafts, function(i,v){
    if (!(undefined != v.submit_status && "submitting" == v.submit_status)){
      empty_list = false;
      out = out + "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">" +
          "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />" +
          "<div class=\"points\">Order #: " + ((/^new_on_device/ig).test(v.supply_order_id) ? '<span>sync required</span>' : v.supply_order_id) + "<br/ >"+v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+"</div>" +
          "<div class=\"left_points\">" +
            "<div class=\"points_time\">" +
              "<span class=\"time\">" + v.order_form + "</span><br />" +
              "<span class=\"time\">Draft saved: <strong>" + v.updated_at + "</strong></span>" +
            "</div>" +
          "</div>" +
          "<div class=\"right_points\">" +
            "<div class=\"box_points\">" +
              "<div>" +
                "<span class=\"points_class\">Total:</span><br />" +
                "<span class=\"big_points\">$" + v.total + "</span><br />" +
              "<span class=\"procent\">Budget: $"+ ((v.remaining_budget == ~~v.remaining_budget)? ~~v.remaining_budget : parseFloat(v.remaining_budget).toFixed(2)) +"</span>" +

              "</div>" +
            "</div>" +
          "</div>" +
        "</a></li>";
    }
  });
  if (empty_list){
    out = out + "<li>Empty</li>";
  }
  out = out + "</ul>";
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('SubmittedOrderContent', function(submitted_orders){
  var out = "",
      empty_list = true;
  out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
  out = out + "<li data-role=\"list-divider\" role=\"heading\">Last 5 Submitted Orders</li>";
  $.each(submitted_orders, function(i,v){
    empty_list = false;
    out = out + "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">"+
        "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />"+
        "<div class=\"points\">Order #: " + ((/^new_on_device/ig).test(v.supply_order_id) ? '<span>sync required</span>' : v.supply_order_id) + "<br/ >"+v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+"</div>" +
        "<div class=\"left_points\">" +
          "<div class=\"points_time\">" +
            "<span class=\"time\">" + v.order_form + "</span><br />" +
            "<span class=\"time\">Submitted: <strong>" + v.updated_at + "</strong></span>" +
          "</div>" +
        "</div>" +
        "<div class=\"right_points\">" +
          "<div class=\"box_points\">" +
            "<div>" +
              "<span class=\"points_class\">Total:</span><br />" +
              "<span class=\"big_points\">$" + v.total + "</span><br />" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</a></li>";
//        v.site_name +"<br/>"+ v.site_address +"<br/>"+ v.order_form +"<br/>Submitted: "+ v.order_date +"<br/>Total: $"+ v.total +"</a></li>";
  });
  if (empty_list){
    out = out + "<li>Empty</li>";
  }
  out = out + "</ul>";

  return new Handlebars.SafeString(out);
});

SupplierView.template = Handlebars.compile($("#supplier-main-tpl").html());