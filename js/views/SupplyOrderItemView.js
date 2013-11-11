var SupplyOrderEditItemView = function(item_id){

  this.render = function(){
    var context = {},
        self = this;
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.order_id = app.activeOrder().id;

    context.item = (function(){
      var return_item = {},
          activeOrder = app.activeOrder().upd;
      $.each(Object.keys(activeOrder.supply_order_categories), function(i,v){
        $.each(Object.keys(activeOrder['supply_order_categories'][v]), function(ik,vk){
          if (item_id == vk){
            return_item = $.extend(activeOrder['supply_order_categories'][v][vk], {category: v});
            return false;
          }
        });
      });
      return return_item;
    })();

    this.el.html(SupplyOrderEditItemView.template(context));
    return this;
  };

  this.initialize = function(){
    var self = this;
    this.el = $('<div/>');

    this.el.on("change", "#item_amount", function(e){
      e.preventDefault();
      $("#total").text( "$" + (parseFloat($(e.currentTarget).val()) * parseFloat($("#price").text().substring(1))).toFixed(2) );
    });

    this.el.on("click", "#item_amount", function(e){
      e.preventDefault();
      $(e.currentTarget).select();
    });

    this.el.on("click", "button", function(e){
      e.preventDefault();
      var order = app.activeOrder();
      order['upd']['supply_order_categories'][$("#category").text()][$("#item_id").val()]["amount"] =
          ("remove_btn" == $(e.currentTarget).attr("id")) ? 0 : $("#item_amount").val();
      app.activeOrder(order);
      setTimeout(function(){
        app.route({
          toPage: window.location.href + "#order:" + order.id
        });
      }, 0);
    });
  };

  this.initialize();
}

Handlebars.registerHelper("editItemContent", function(item){
  var order = app.activeOrder().upd,
      out = "<div data-role=\"content\" class=\"log inspect draft neworder\">";

  out = out + "<div class=\"location_details\">";
  out = out + "<p>Order #: <em>"+ ((/^new_on_device/ig).test(order.supply_order_id)? '-': order.supply_order_id)+"</em></p>";
  out = out + "<p><font>"+order.site_name+"</font><br /><em>"+order.site_address+"</em></p>";
  out = out + "<p>Order type: <span>"+order.order_form+"</span>";
  out = out + "<br />Order date: <span>"+ (('' != order.order_date) ? order.order_date : '-') +"</span>";
  out = out + "<br />Draft saved: <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>";
  if ("log" != order.order_status){
    out = out + "<br /><strong>Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2)+"</span></strong>";
  }
  out = out + "</p>";
  out = out + "</div>";

  out = out + "<div class=\"order_form_selection\">" +
    "<input id=\"item_id\" name=\"item_id\" type=\"hidden\" value=\"" + item.item_id + "\" />" +
    "<div class=\"box paper\">" +
      "<div role=\"heading\" class=\"boxheader\">Order Item Info</div>" +
      "<div class=\"boxpoints\">" +
        "<div class=\"boxcntone\">" +
          "<div data-role=\"fieldcontain\">" +
            "<dl><dt>Category:</dt><dd id=\"category\">" + item.category + "</dd></dl>"+
            "<dl><dt>Serial Number:</dt><dd>" + item.serial_number + "</dd></dl>"+
            "<dl><dt>Description:</dt><dd>" + item.description + "</dd></dl>" +
            "<dl><dt>Measurement:</dt><dd>" + item.measurement + "</dd></dl>" +
            "<dl><dt>Price:</dt><dd id=\"price\">$" + parseFloat(item.price).toFixed(2) + "</dd></dl>" +
            "<dl><dt>Total:</dt><dd id=\"total\">$"+ parseFloat(item.amount*item.price).toFixed(2) +"</dd></dl></dl>" +
            "<div data-role=\"fieldcontain\">" +
              "<label for=\"item_amount\">Amount:</label>" +
              "<input id=\"item_amount\" name=\"item_amount\" type=\"number\" value=\""+(("Each" == item.measurement)? parseInt(item.amount):parseFloat(item.amount))+"\" pattern=\""+(("Each" == item.measurement)? "[0-9]+":"[0-9\.]+[0-9]$")+"\" />" +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>" +
    "</div>" +
  "</div>";

  out = out + "<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
  out = out + "<td class=\"green_btn btnbox_1\"><button id=\"save_btn\">Set</button></td>";
  out = out + "<td width=\"2%\">&nbsp;</td>";
  out = out + "<td class=\"green_btn\"><button id=\"remove_btn\">Clear</button></td>";
  out = out + "</tr></table>";

  out = out + "</div>";

  return new Handlebars.SafeString(out);
});

SupplyOrderEditItemView.template = Handlebars.compile($("#order-item-tpl").html());


/* ---------------------------------------------------------------------------------------------------------*/

var SupplyOrderAddItemView = function(order_id){
  this.order_id = order_id || false;

  this.render = function(){
    var context = {},
        self = this;
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.order_id = self.order_id;

    this.el.html(SupplyOrderAddItemView.template(context));
    return this;
  };

  this.initialize = function(){
    var self = this;
    this.el = $('<div/>');

    this.el.on('change', "select#category", function(e){
      var out = "",
          category_out = "";
          chosen = $(e.currentTarget).val(),
          order = app.activeOrder().upd;

      if(chosen.length>0){
        if ("all" == chosen){
          $.each(Object.keys(order.supply_order_categories), function(i,cat_name){
            category_out = "";
            var category = order.supply_order_categories[cat_name];
            $.each(Object.keys(category), function(ik,serial_number){
              if (parseFloat(category[serial_number]["amount"]) == 0){
                var item = category[serial_number];
                category_out = category_out + "<li><a href=\"#editOrderItem:"+serial_number+"\">";
                category_out = category_out + "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />";
                category_out = category_out + "<span>" + item.serial_number +" - "+item.description +"<br/>Measurement: "+item.measurement +"</span><br /><div class=\"bld\">Price: $"+ parseFloat(item.price).toFixed(2) +"</div>";
                category_out = category_out + "</a></li>";
              }
            });
            if (category_out.length>0){
              out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li data-role=\"list-divider\" role=\"heading\">"+ cat_name +"</li>" + category_out + "</ul>";
            }
          });
        } else {
          category_out = "";
          $.each(Object.keys(order.supply_order_categories[chosen]), function(ik,serial_number){
            var item = order.supply_order_categories[chosen][serial_number];
            if (parseFloat(item.amount) == 0){
              category_out = category_out + "<li><a href=\"#editOrderItem:"+serial_number+"\">";
              category_out = category_out + "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />";
              category_out = category_out + "<span>" + item.serial_number +" - "+item.description +"<br/>Measurement: "+item.measurement +"</span><br /><div class=\"bld\">Price: $"+ parseFloat(item.price).toFixed(2) +"</div>";
              category_out = category_out + "</a></li>";
            }
          });
          if (category_out.length>0){
            out = out + "<ul data-role=\"listview\" data-inset=\"true\">" + category_out + "</ul>";
          } else {
            out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li>Empty</li></ul>";
          }
        }
        out = out + "</ul>";
      }
        $("#list_items").html(out);
        $("ul", $("#list_items")).listview();
    });
  };

  this.initialize();
}

Handlebars.registerHelper("backButtonItemView", function(id){
  var out;
  if (id === false){
    out = "<a href=\"#orders\" class=\"ui-btn-right\" data-role=\"button\" >Back</a>"
  } else {
    out = "<a href=\"#order:"+id+"\" class=\"ui-btn-right\" data-role=\"button\" >Back</a>"
  }
  return new Handlebars.SafeString(out);
});


Handlebars.registerHelper("addItemContent", function(){
  var order = app.activeOrder().upd,
      out = "<div data-role=\"content\" class=\"log inspect draft\">";

  out = out + "<div class=\"location_details\">";
  out = out + "<p>Order #: <em>"+ ((/^new_on_device/ig).test(order.supply_order_id)? '-': order.supply_order_id)+"</em></p>";
  out = out + "<p><font>"+order.site_name+"</font><br /><em>"+order.site_address+"</em></p>";
  out = out + "<p>Order type: <span>"+order.order_form+"</span>";
  out = out + "<br />Order date: <span>"+ (('' != order.order_date) ? order.order_date : '-') +"</span>";
  out = out + "<br />Draft saved: <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>";
  if ("log" != order.order_status){
    out = out + "<br /><strong>Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span></strong>";
  }
  out = out + "</p></div><br />";

  out = out + "<select name=\"category\" id=\"category\">";
  out = out + "<option value=\"\">- Select Category -</option>";
  $.each(Object.keys(order.supply_order_categories), function( index, value ) {
    out = out + "<option value=\"" + value + "\">" + value + "</option>";
  });
  out = out + "<option value=\"all\">All Categories</option>";
  out = out + "</select>";

  out = out + "<div id=\"list_items\"></div>";

  out = out + "</div>";

  return new Handlebars.SafeString(out);
});

SupplyOrderAddItemView.template = Handlebars.compile($("#add-order-item-tpl").html());