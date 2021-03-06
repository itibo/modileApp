var SupplierView = function(){

  this.render = function(){
    var context = {},
        filter_site_id = app.siteFilter(),
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
        },
        getPriority = function(item){
          var priorities = [{
            shortcode: "high",
            label: "High - 2 business days"
          }, {
            shortcode: "urgent",
            label: "Urgent - ASAP"
          }];

          var tmp_arr = $.grep(priorities, function(n,ind){ return (undefined != item.priority && n.shortcode == String(item.priority).toLowerCase())} );
          return (tmp_arr.length>0) ? tmp_arr[0]["label"] : "";
        };
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;

    context.sites = (function(){
      return $.merge([ $.extend({}, app.diamond_office, {
        selected: ((undefined != filter_site_id && "diamond_office" == String(filter_site_id))? true : false)
      })], $.map(app.mySites(), function(st){
        return $.extend({}, {
          site_id: st.site_id,
          site_name: st.site,
          site_address: st.address,
          client: st.client,
          client_group: st.client_group,
          selected: ((undefined != filter_site_id && String(filter_site_id) == String(st.site_id) )? true : false)
        });
      }));
    })();

    context.supplyPeriod = (function(){
      var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
      var formattedDate = new Date();
      return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
    })();
    context.drafts = (function(){
      var return_arr = [],
          drafts = app.mySupplyOrdersDrafts();

      $.each(drafts, function(i,v){
        if ( (undefined != v.submit_status && "submitting" == v.submit_status) || ( undefined != v.to_remove )){
          // skip
        } else {
          if ( (undefined == filter_site_id) || ( undefined != filter_site_id && String(filter_site_id) == String(v.site_id) )
              || (undefined != filter_site_id && "diamond_office" == String(filter_site_id) && "" == String(v.site_id)) ) {
            return_arr.push({
              supply_order_id: v.supply_order_id,
              supply_order_name: v.supply_order_name,
              site_name: v.site_name,
              site_address: v.site_address,
              order_form: v.order_form,
              priority: getPriority(v),
              order_date: v.order_date,
              updated_at: v.updated_at,
              remaining_budget: v.remaining_budget,
              syncing: (undefined !== v.locally_saved || undefined !== v.sending),
              total: String(calculate_total(v))
            });
          }
        }
      });
      return return_arr;
    })();

    context.submitted_orders = (function(){
      var return_arr = [],
          submitted_orders = app.myLastSubmittedOrders();
      $.each(submitted_orders, function(i,v){
        if ( (undefined == filter_site_id) || ( undefined != filter_site_id && String(filter_site_id) == String(v.site_id) )
            || (undefined != filter_site_id && "diamond_office" == String(filter_site_id) && "" == String(v.site_id)) ) {
          return_arr.push({
            supply_order_id: v.supply_order_id,
            supply_order_name: v.supply_order_name,
            site_name: v.site_name,
            site_address: v.site_address,
            order_form: v.order_form,
            priority: getPriority(v),
            order_date: v.order_date,
            updated_at: v.updated_at,
            status: v.status,
            total: calculate_total(v)
          });
        }
      });
      return return_arr;
    })();

    context.future_orders = (function(){
      var return_arr = [],
          future_orders = app.myFutureOrders();
      $.each(future_orders, function(i,v){
        if ( undefined != v.to_remove ){
          // skip
        } else {
          if ( (undefined == filter_site_id) || ( undefined != filter_site_id && String(filter_site_id) == String(v.site_id) )
              || (undefined != filter_site_id && "diamond_office" == String(filter_site_id) && "" == String(v.site_id)) ) {
            return_arr.push({
              supply_order_id: v.supply_order_id,
              supply_order_name: v.supply_order_name,
              site_name: v.site_name,
              site_address: v.site_address,
              order_form: v.order_form,
              priority: getPriority(v),
              order_date: v.order_date,
              updated_at: v.updated_at,
              syncing: (undefined !== v.locally_saved || undefined !== v.sending),
              total: calculate_total(v)
            });
          }
        }
      });
      return return_arr;
    })();

    context.tabsInfo = {
      draftsCount: context.drafts.length || 0,
      submittedOrdersCount: context.submitted_orders.length || 0,
      futureOrdersCount: context.future_orders.length || 0,
      active_tab: app.activeTab()
    }

    this.el.html(SupplierView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this,
        holdCords = {
          holdX : 0,
          holdY : 0
        };
    this.el = $('<div/>');

    this.el.on('click', '#start_new', function(event){
      event.preventDefault();
      app.route({
        toPage: window.location.href + "#order:new"
      });
    });

    this.el.on('click', '#start_future', function(event){
      event.preventDefault();
      app.route({
        toPage: window.location.href + "#order:future"
      });
    });

    this.el.on('vmousedown', 'li.editable', function(event){
      holdCords.holdX = event.pageX;
      holdCords.holdY = event.pageY;
    });

    this.el.on('taphold', 'li.editable', function(event){
      event.preventDefault();
      var order_id = $("a", $(event.currentTarget)).attr("href").match(/^#order:(.+)$/)[1],
          order_type = "next_month" === $(event.currentTarget).closest("ul").attr("id") ? "future" : "draft",
          $popup = $("#context_menu"),
          $overlay = $("<div />", {
            class: "popup-overlay"
          }).on("click", function(e){
            e.preventDefault();
            $overlay.remove();
            $("input", $popup).val( "" );
            $popup.css("visibility","hidden");
          });
      $overlay.appendTo("body").trigger("create");
      $("input", $popup).val( order_type + ":" + order_id );
      $popup.css("left", ($(window).width() - $popup.width())/2  + "px");
      $popup.css("top", ( ( ($(document).scrollTop() + $(window).height() - holdCords.holdY)< $popup.height()) ? (holdCords.holdY - $popup.height()) : (holdCords.holdY - $popup.height()/2) ) + "px");
      $popup.css("visibility","visible");
    });

    this.el.on('click', '#remove_order', function(e){
      e.preventDefault();

      var order_type = ($("input", $(e.currentTarget).closest("div#context_menu")).val()).match(/^(\w+):(.+)$/)[1],
          order_id = ($("input", $(e.currentTarget).closest("div#context_menu")).val()).match(/^(\w+):(.+)$/)[2];

      navigator.notification.confirm(
          "Are you sure you want to remove " + (("future" === order_type) ? "this future order?" : "this draft?"),
          function(buttonIndex){
            $("#context_menu").css("visibility","hidden");
            $(".popup-overlay").remove();
            if(2 == buttonIndex){

              var method = ("future" === order_type) ? "myFutureOrders" : "mySupplyOrdersDrafts",
                  orders = app[method](),
                  mutation = app.ids_mutation(),
                  check_array;
              app[method]((function(){
                $.each(orders, function(i,v){
                  check_array = [];
                  try {
                    check_array = $.merge([String(v.supply_order_id)], (function(){
                      if (undefined != mutation[v.supply_order_id])
                        return [String(mutation[v.supply_order_id])];
                      else
                        return [];
                    })());
                  } catch(e){
                    check_array = [String(v.supply_order_id)];
                  }

                  if ($.inArray(order_id, check_array) > -1 ){
                    orders[i]["updated_at_utc"] = (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');
                    orders[i]['to_remove'] = true;
                    if (undefined != mutation[v.supply_order_id]){
                      orders[i]["supply_order_id"] = mutation[v.supply_order_id];
                      orders[i]["id"] = mutation[v.supply_order_id];
                    }
                    return false;
                  }
                });
                return orders;
              })());

              setTimeout(function(){
                app.sync();
                app.route({
                  toPage: window.location.href + "#orders"
                });
              },0);
            }
          },
          (("future" === order_type) ? "Future Orders" : "Drafts"),
          ['Cancel','Remove']
      );
    });

    this.el.on("click", 'div[data-role=navbar] div a', function(e){
      e.preventDefault();
      e.stopPropagation();

      var $elm = $(e.currentTarget);
      $('div[data-role="navbar"] > div').removeClass("active");
      $elm.closest("div").addClass("active");
      $('ul[data-role="listview"]').hide();
      app.activeTab(($elm.attr("href")).substring(1));
      $($elm.attr("href")).show();
    });

    this.el.on("change", "#sites_filter", function(e){
      e.preventDefault();

      var selected_site = $(e.currentTarget).val();
      selected_site = ("" != selected_site) ? selected_site : false;
      app.siteFilter( selected_site ) ;
      setTimeout(function(){
        app.route({
          toPage: window.location.href + "#orders"
        });
      },0);
    });

  };

  this.initialize();
}

Handlebars.registerHelper('SitesFilter', function(sites){
  var out = "<select id=\"sites_filter\">"+
    "<option value=\"\">-- All Sites --</option>";
  $.each(sites, function(i,st){
    out = out + "<option value=\""+ st.site_id +"\""+ ((st.selected)?' selected="selected"':'') +">"+ st.site_name +"</option>";
  });
  out = out + "</select>";
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('tabsContent', function(options){
  return options.fn(this);
});

Handlebars.registerHelper('tabsHeaders', function(){
  var out = "<div data-role=\"navbar\">" +
          "<div class=\"draft"+ (("drafts" === this.tabsInfo.active_tab) ? ' active':'') +"\">" +
            "<a href=\"#drafts\""+ (("drafts" === this.tabsInfo.active_tab) ? ' class="ui-btn-active ui-state-persist"':'') +">Drafts ("+ this.tabsInfo.draftsCount +")</a>" +
          "</div>&nbsp;" +
          "<div class=\"submitted"+ (("submitted" === this.tabsInfo.active_tab) ? ' active':'') +"\">" +
            "<a href=\"#submitted\""+ (("submitted" === this.tabsInfo.active_tab) ? ' class="ui-btn-active ui-state-persist"':'') +">Submitted ("+ this.tabsInfo.submittedOrdersCount +")</a>" +
          "</div>&nbsp;" +
          "<div class=\"next_month"+ (("next_month" === this.tabsInfo.active_tab) ? ' active':'') +"\">" +
            "<a href=\"#next_month\""+ (("next_month" === this.tabsInfo.active_tab) ? ' class="ui-btn-active ui-state-persist"':'') +">Future ("+ this.tabsInfo.futureOrdersCount +")</a>" +
          "</div>" +
        "</div>";
  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper('DraftsOrderContent', function(){
  var drafts = this.drafts,
      not_visible = "drafts" !== this.tabsInfo.active_tab ? " style=\'display:none;\'" : "",
      out = ["<ul id=\"drafts\" data-role=\"listview\" data-inset=\"true\" class=\"draft\""+not_visible+">"];
  if (drafts.length > 0){
    $.each(drafts, function(i,v){
      if (!(undefined != v.submit_status && "submitting" == v.submit_status)){
        out.push("<li class=\"editable inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">" +
          ( v.syncing ? "<div class=\"syncreq\">waiting for sync</div>" : "") +
          "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />" +
          "<div class=\"points\">Order: " + ((/^new_on_device/ig).test(v.supply_order_id)
              ? '<span>-</span>'
              : ('#' + v.supply_order_id) + '<span> from </span>' +  (('' != v.order_date) ? v.order_date : '-') ) +
            "<br/ >"+v.site_name +"<br/><span class=\"address\">"+ v.site_address +"</span><br/>"+"</div>" +
            "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
              "<td class=\"points_time\">" +
                "<span class=\"time\">" + v.order_form + "</span><br />" +
                (("" != v.priority ) ? ('<span class=\"priority '+ (v.priority.match(/^(.+?)\b/)[0]).toLowerCase() +'\">Priority: <strong>'+ v.priority +'</strong></span><br />') :'' ) +
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
          "</a></li>");
      }
    });
    out.push("</ul>");
  } else {
    out.push("<li>No orders</li></ul>");
  }
  return new Handlebars.SafeString(out.join(""));
});

Handlebars.registerHelper('SubmittedOrderContent', function(){
  var submitted_orders = this.submitted_orders,
      not_visible = "submitted" !== this.tabsInfo.active_tab ? " style=\'display:none;\'" : "",
      out = ["<ul id=\"submitted\" data-role=\"listview\" data-inset=\"true\""+not_visible+">"];
  if (submitted_orders.length>0){
    $.each(submitted_orders, function(i,v){
      out.push("<li class=\"inspectable\"><a href=\"#order-overall:"+ v.supply_order_id +"\">"+
        "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />"+
        "<div class=\"points\">Order: " + ((/^new_on_device/ig).test(v.supply_order_id)
            ? '<span>-</span>'
            : ('#' + v.supply_order_id) + '<span> from </span>' +  (('' != v.order_date) ? v.order_date : '-') ) +
          ((undefined !== v.status && "rejected" == v.status) ? (" <span style=\"color:red;\">(rejected)</span>") : "") +
          "<br/>"+v.site_name +"<br/><span class=\"address\">"+ v.site_address +"</span><br/></div>" +
        "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
          "<td class=\"points_time\">" +
            "<span class=\"time\">" + v.order_form + "</span><br />" +
            (("" != v.priority ) ? ('<span class=\"priority '+ (v.priority.match(/^(.+?)\b/)[0]).toLowerCase() +'\">Priority: <strong>'+ v.priority +'</strong></span><br />') :'' ) +
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
      "</a></li>");
    });
    out.push("</ul>");
  } else {
    out.push("<li>No orders</li></ul>");
  }
  return new Handlebars.SafeString(out.join(""));
});

Handlebars.registerHelper('FutureOrdersContent', function(){
  var future_orders = this.future_orders,
      not_visible = "next_month" !== this.tabsInfo.active_tab ? " style=\'display:none;\'" : "",
      out = ["<ul id=\"next_month\" data-role=\"listview\" data-inset=\"true\" class=\"next_month_orders\""+not_visible+">"];
  if (future_orders.length>0){
    $.each(future_orders, function(i,v){
      out.push("<li class=\"editable inspectable\"><a href=\"#order:"+ v.supply_order_id +"\">"+
        ( v.syncing ? "<div class=\"syncreq\">waiting for sync</div>" : "") +
        "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />"+
        "<div class=\"points\">Order: " + ( (/^new_on_device/ig).test(v.supply_order_id)
              ? '<span>-</span>'
              : ('#' + v.supply_order_id) + '<span> from </span>' +  (('' != v.order_date) ? v.order_date : '-') ) +
          "<br/>"+v.site_name +"<br/><span class=\"address\">"+ v.site_address +"</span><br/></div>" +
        "<table class=\"left_points\" cellpadding=\"0\" cellspacing=\"0\" border=\"0\"><tr>" +
          "<td class=\"points_time\">" +
            "<span class=\"time\">" + v.order_form + "</span><br />" +
            (("" != v.priority ) ? ('<span class=\"priority '+ (v.priority.match(/^(.+?)\b/)[0]).toLowerCase() +'\">Priority: <strong>'+ v.priority +'</strong></span><br />') :'' ) +
            "<span class=\"time\">Saved: <strong>" + (('' != v.updated_at) ? v.updated_at : '-') + "</strong></span>" +
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
      "</a></li>");
    });
    out.push("</ul>");
  } else {
    out.push("<li>No orders</li></ul>");
  }
  return new Handlebars.SafeString(out.join(""));
});

SupplierView.template = Handlebars.compile($("#supplier-main-tpl").html());