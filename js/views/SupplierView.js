var SupplierView = function(){

  this.render = function(){
    var context = {},
        calculate_total = function(order){
          var tmp = 0,
              order = ((undefined != order.locally_saved && !$.isEmptyObject(order.locally_saved)) ?
                  order.locally_saved : order );

          $.each(Object.keys(order.supply_order_categories), function(ie,ve){
            var category = order['supply_order_categories'][ve];
            $.each(Object.keys(category), function(ik, vk){
              var item = category[vk];
              if (item.amount > 0){
                tmp += parseFloat(item.price) * parseFloat(item.amount);
              }
            });
          });

          return tmp.toFixed(2);
        };
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.supplyPeriod = (function(){
      var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
      var formattedDate = new Date();
      return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
    })();
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

    this.el.on('taphold', 'li.inspectable', function(event){
      event.preventDefault();
      var draft_id = $("a", $(event.currentTarget)).attr("href").match(/^#order:(.+)$/)[1];
      $("#context_menu input").val( draft_id );
      $("#context_menu").popup("open");
    });

  };

  this.initialize();
}

Handlebars.registerHelper('DraftsOrderContent', function(drafts){
  var out = "";
  if (drafts.length > 0){
    out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"draft\">";
    out = out + "<li data-role=\"list-divider\" role=\"heading\">Draft Orders</li>";
    $.each(drafts, function(i,v){
      if (!(undefined != v.submit_status && "submitting" == v.submit_status)){
        out = out +
            "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">" +
            "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />" +
            "<div class=\"points\">Order #: " + ((/^new_on_device/ig).test(v.supply_order_id) ? '<span>sync required</span>' : v.supply_order_id) + "<br/ >"+v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+"</div>" +
              "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
                "<td class=\"points_time\">" +
                  "<span class=\"time\">" + v.order_form + "</span><br />" +
                  "<span class=\"time\">Order date: <strong>" + (('' != v.order_date) ? v.order_date : '-') + "</strong></span><br />" +
                  "<span class=\"time\">Draft saved: <strong>" + (('' != v.updated_at) ? v.updated_at : '-') + "</strong></span>" +
                "</td>" +
                "<td class=\"right_points\">" +
                  "<div class=\"box_points\">" +
                    "<div>" +
                      "<span class=\"points_class\">Total:</span><br />" +
                      "<span class=\"big_points\">$" + v.total + "</span><br />" +
                      "<span class=\"procent\">Budget: $"+ parseFloat(v.remaining_budget).toFixed(2) +"</span>" +
                    "</div>" +
                  "</div>" +
                "</td>" +
              "</tr></table>" +
            "</a></li>";
      }
    });
    out = out + "</ul>";
  }

  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('SubmittedOrderContent', function(submitted_orders){
  var out = "";
  if (submitted_orders.length>0){
    out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
    out = out + "<li data-role=\"list-divider\" role=\"heading\">Last 5 Submitted Orders</li>";
    $.each(submitted_orders, function(i,v){
      out = out + "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">"+
          "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />"+
          "<div class=\"points\">Order #: " + ((/^new_on_device/ig).test(v.supply_order_id) ? '<span>sync required</span>' : v.supply_order_id) + "<br/ >"+v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+"</div>" +
          "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
            "<td class=\"points_time\">" +
              "<span class=\"time\">" + v.order_form + "</span><br />" +
              "<span class=\"time\">Order date: <strong>" + (('' != v.order_date) ? v.order_date : '-') + "</strong></span><br />" +
              "<span class=\"time\">Submitted: <strong>" + (('' != v.updated_at) ? v.updated_at : '-') + "</strong></span>" +
            "</td>" +
            "<td class=\"right_points\">" +
              "<div class=\"box_points\">" +
                "<div>" +
                  "<span class=\"points_class\">Total:</span><br />" +
                  "<span class=\"big_points\">$" + v.total + "</span><br />" +
                "</div>" +
              "</div>" +
            "</td>" +
          "</tr></table>" +
        "</a></li>";
    });
    out = out + "</ul>";
  }
  return new Handlebars.SafeString(out);
});

SupplierView.template = Handlebars.compile($("#supplier-main-tpl").html());