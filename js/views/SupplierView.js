var SupplierView = function(){

  this.render = function(){
    var context = {};
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.drafts = (function(){
      var return_arr = [],
          drafts = app.mySupplyOrdersDrafts();
      $.each(drafts, function(i,v){
        var total = (function(draft){
          var tmp = 0;
          if (undefined != draft.locally_saved && !$.isEmptyObject(draft.locally_saved)){
//            alert(JSON.stringify(draft.locally_saved));
            $.each(Object.keys(draft.locally_saved.supply_order_categories), function(ie,ve){
              var category = draft['locally_saved']['supply_order_categories'][ve];
              $.each(Object.keys(category), function(ik, vk){
                var item = category[vk];
                if (item.amount > 0){
                  tmp += parseFloat(item.price) * parseFloat(item.amount);
                }
              });
            });
          } else {
            $.each(draft.supply_order_categories, function(ie,ve){
              $.each(ve.supply_order_detail, function(ik, vk){
                tmp += parseFloat(vk.price) * parseFloat(vk.amount);
              });
            });
          }
          return tmp.toFixed(2);
        })(v);
        return_arr.push({
          supply_order_id: v.supply_order_id,
          supply_order_name: v.supply_order_name,
          site_name: v.site_name,
          site_address: v.site_address,
          order_form: v.order_form,
          order_date: v.order_date,
          total: total
        });
      });
      return return_arr;
    })();
    context.submitted_orders = (function(){
      var return_arr = [],
          submitted_orders = app.myLastSubmittedOrders();

      $.each(submitted_orders, function(i,v){
        var total = (function(submitted_order){
          var tmp = 0;
          $.each(submitted_order.supply_order_categories, function(ie,ve){
            $.each(ve.supply_order_detail, function(ik, vk){
              tmp += parseFloat(vk.price) * parseFloat(vk.amount);
            });
          });
          return tmp.toFixed(2);
        })(v);
        return_arr.push({
          supply_order_id: v.supply_order_id,
          supply_order_name: v.supply_order_name,
          site_name: v.site_name,
          site_address: v.site_address,
          order_form: v.order_form,
          order_date: v.order_date,
          total: total
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
  var out = "";

  out = out + "<ul data-role=\"listview\" data-inset=\"true\" class=\"draft\">";
  out = out + "<li data-role=\"list-divider\" role=\"heading\">Draft Orders</li>";
  $.each(drafts, function(i,v){
    out = out + "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">" +
        "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />" +
        "<div class=\"left_points\">" +
          v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+
          "<div class=\"points_time\">" +
            "<span class=\"time\">" + v.order_form + "</span><br />" +
            "<span class=\"time\">Draft saved: <strong>" + v.order_date + "</strong></span>" +
          "</div>" +
        "</div>" +
        "<div class=\"points\">" +
          "<div class=\"box_points\">" +
            "<span class=\"points_class\">Total:</span><br />" +
            "<span class=\"big_points\">$" + v.total + "</span><br />" +
            "<span class=\"procent\">Budget: ??? $</span>" +
          "</div>" +
        "</div>" +
      "</a></li>";
  });
  out = out + "</ul>";
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('SubmittedOrderContent', function(submitted_orders){
  var out = "";

  out = out + "<ul data-role=\"listview\" data-inset=\"true\">";
  out = out + "<li data-role=\"list-divider\" role=\"heading\">Last 5 Submitted Orders</li>";
  $.each(submitted_orders, function(i,v){
    out = out + "<li class=\"inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">"+
        "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />"+
        "<div class=\"left_points\">" +
          v.site_name +"<br/><span class=\"adress\">"+ v.site_address +"</span><br/>"+
          "<div class=\"points_time\">" +
            "<span class=\"time\">" + v.order_form + "</span><br />" +
            "<span class=\"time\">Draft saved: <strong>" + v.order_date + "</strong></span>" +
          "</div>" +
        "</div>" +
        "<div class=\"points\">" +
          "<div class=\"box_points\">" +
            "<span class=\"points_class\">Total:</span><br />" +
            "<span class=\"big_points\">$" + v.total + "</span><br />" +
            "<span class=\"procent\">Budget: ??? $</span>" +
          "</div>" +
        "</div>" +
      "</a></li>";
//        v.site_name +"<br/>"+ v.site_address +"<br/>"+ v.order_form +"<br/>Submitted: "+ v.order_date +"<br/>Total: $"+ v.total +"</a></li>";
  });
  out = out + "</ul>";

  return new Handlebars.SafeString(out);
});

SupplierView.template = Handlebars.compile($("#supplier-main-tpl").html());