var OrderView = function(order_id){
  this.order_id = order_id || "new";
  this.reordered_sites = {};

  this.render = function(){
    var context = {},
        self = this,
        formatObject = function(object){
          var tmp_obj = {};
          $.each(Object.keys(object), function(obj_key_ind, obj_key_val){
            if ($.inArray(typeof object[obj_key_val], ["string", "number", "boolean"])>-1){
              tmp_obj[obj_key_val] = object[obj_key_val];
            } else {
              tmp_obj[obj_key_val] = {};
            }
          });
          $.each(object.supply_order_categories, function(category_ind, category_val){
            tmp_obj['supply_order_categories'][category_val.category] = {};
            $.each(category_val.supply_order_detail, function(item_ind, item_val){
              tmp_obj['supply_order_categories'][category_val.category][item_val.item_id] = item_val;
            });
          });
          return tmp_obj;
        };
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.order = {};
//    alert("order_id on load: " + self.order_id);
    if ("new" == self.order_id){
      context.title = "New Order";
      context.new = "new";
    } else {
      context.title = "Order Details";

      (function(mutations_obj){
        var activeOrder = app.activeOrder(),
            _old_order_id = self.order_id;
        if ($.inArray(self.order_id, Object.keys(mutations_obj))>-1){
          self.order_id = mutations_obj[self.order_id];
          mutations_obj[_old_order_id] = void 0;
        }

//        alert("order_id after mutke with mutations: " + self.order_id);

        context.order = (function(){
          if ($.isEmptyObject(activeOrder) || undefined == activeOrder.id || $.inArray( activeOrder.id, [self.order_id, _old_order_id] ) < 0 ){
            var obj = {};

            if (RegExp('^new_on_device_','i').test(self.order_id)){

              var site_info = (function(site_id){
                var tmp = {};
                $.each(app.mySites(), function(i,s){
                  if (site_id == s.site_id){
                    tmp = s;
                    return false;
                  }
                });
                return {
                  site_id: tmp.site_id,
                  site_name: tmp.site,
                  site_address: tmp.address
                };
              })(self.order_id.match(/^new_on_device_(.*)_(.*)_(.*)$/)[2]);

              var form_and_items_info = (function(form){
                var tmp = {},
                    return_obj = {};
                $.each(app.supplyOrdersTemplate(), function(i,tmpl){
                  if ( RegExp('^'+ form +'\\b','i').test(tmpl.order_form) ){
                    tmp = tmpl;
                    return false;
                  }
                });
                return_obj.order_form = tmp.order_form;
                return_obj.supply_order_categories = [];
                $.each(tmp.categories, function(i,cat){
                  return_obj['supply_order_categories'].push((function(category_obj){
                    var category_content = {};
                    category_content.category = category_obj.category;
                    category_content.supply_order_detail = [];
                    $.each(category_obj.items, function(ik,item){
                      category_content.supply_order_detail.push($.extend(item, {amount: 0}));
                    });
                    return category_content;
                  })(cat));
                });
                return return_obj;
              })(self.order_id.match(/^new_on_device_(.+)_(.+)_(.*)$/)[1]);

              obj = $.extend(obj, {
                supply_order_id: self.order_id,
                supply_order_name: "",
                updated_at: "",
                order_date: "",
                special_instructions: "",
                remaining_budget: ""
              },site_info, formatObject(form_and_items_info), {
                order_status: "new"
              });
            } else {
              $.each(app.mySupplyOrdersDrafts(), function(i,v){
                if (self.order_id == v.supply_order_id && (undefined == typeof (v.submit_status) || "submitting" != v.submit_status)){
                  if ("undefined" != v.locally_saved && !$.isEmptyObject(v.locally_saved)){
                    obj = v.locally_saved;
                  } else {
                    obj = $.extend(formatObject(v), {order_status: "draft"});
                  }
                  return false;
                }
              });
              if ($.isEmptyObject(obj)){
                $.each(app.myLastSubmittedOrders(), function(i,v){
                  if (self.order_id == v.supply_order_id){
                    obj = $.extend(formatObject(v), {order_status: "log"});
                    return false;
                  }
                });
              }
            }
            activeOrder = app.activeOrder($.extend({
              id: self.order_id,
              status: obj.order_status
            }, {
              proto: (obj.order_status == "new") ? {} : obj,
              upd: obj
            }));
          } else {
            // mutations in action
            activeOrder = app.activeOrder((function(){

              var tmp = (function(){
                var _tmp = activeOrder.proto;
                _tmp.order_status = (undefined != activeOrder.submit_status && "submitting" == activeOrder.submit_status) ? "log" : "draft";
                if ($.isEmptyObject(_tmp)){
                  $.each(app.mySupplyOrdersDrafts(), function(i,v){
                    if ($.inArray(String(v.supply_order_id), [String(self.order_id), String(_old_order_id)] ) > -1  &&
                        !(undefined != v.submit_status && "submitting" == v.submit_status) ){
                      if (undefined != v.locally_saved && !$.isEmptyObject(v.locally_saved)){
                        _tmp = v.locally_saved;
                      } else {
                        _tmp = $.extend(formatObject(v), {order_status: "draft"});
                      }
                      return false;
                    }
                  });
                  if ($.isEmptyObject(_tmp)){
                    $.each(app.myLastSubmittedOrders(), function(i,v){
                      if ($.inArray(String(v.supply_order_id), [String(self.order_id), String(_old_order_id)] ) > -1 ){
                        if (undefined != v.locally_saved && !$.isEmptyObject(v.locally_saved)){
                          _tmp = v.locally_saved;
                        } else {
                          _tmp = $.extend(formatObject(v), {order_status: "log"});
                        }
                        return false;
                      }
                    });
                  }
                }
                return _tmp;
              })();

              var muted = (function(){
                var _tmp = activeOrder.upd;
                if (_old_order_id != self.order_id){
                  _tmp.supply_order_id = self.order_id
                }
                _tmp.order_status = "draft";
                return _tmp;
              })();

              return $.extend({
                id: self.order_id,
                status: "draft"
              }, {
                proto: tmp,
                upd: muted
              })
            })());
          }
//          alert("activeOrder on the end of content rendering: " + JSON.stringify(activeOrder));
          return activeOrder;
        })();

        app.ids_mutation(mutations_obj);
      })(app.ids_mutation());
    }

    this.el.html(OrderView.template(context));
    return this;
  };

  this.initialize = function() {
    var self = this,
        isObjectsEqual = function(o1,o2,cfg,reverse){
          cfg = cfg || {};
          cfg.exclude = cfg.exclude || {};
          //first we check the reference. we don't care if null== undefined
          if( cfg.strictMode ){
            if( o1 === o2 ) return true;
          }
          else{
            if( o1 == o2 ) return true;
          }
          if( typeof o1 == "number" || typeof o1 == "string" || typeof o1 == "boolean" || !o1 ||
              typeof o2 == "number" || typeof o2 == "string" || typeof o2 == "boolean" || !o2 ){
            return false;
          }
          if( ((o1 instanceof Array) && !(o2 instanceof Array)) ||
              ((o2 instanceof Array) && !(o1 instanceof Array))) return false;

          for( var p in o1 ){
            if( cfg.exclude[p] || !o1.hasOwnProperty(p) ) continue;
            if( !isObjectsEqual.call(self,o1[p],o2[p], cfg ) ) return false;
          }
          if( !reverse && !cfg.noReverse ){
            reverse = true;
            return isObjectsEqual.call(self,o2,o1,cfg,reverse);
          }
          return true;
        };
    this.el = $('<div/>');

    this.el.on("orderevent", function(e){
      e.preventDefault();
      if ("new" == self.order_id){
        $("#new_order", e.currentTarget).show();
      } else {
        $("#edit_order", e.currentTarget).show();
        $(".main").addClass("log inspect draft");
      }
    });

    this.el.on("change", "select[name^=client]", function(e){

      if ( $.isEmptyObject(self.reordered_sites) ) {
        var tmp = {};
        $.each(app.mySites(), function(i, value){
          if ("undefined" == typeof tmp[value.client]){
            tmp[value.client] = {};
          }
          if ("undefined" == typeof tmp[value.client][value.client_group]){
            tmp[value.client][value.client_group] = [];
          }
          tmp[value.client][value.client_group].push(value);
        });
        self.reordered_sites = tmp;
      }

      if ("client" == $(e.currentTarget).attr("id")){
        switch (true) {
          case $(e.currentTarget).val().length == 0:
            $("select#client_group").html("<option value=\"\">- Select Client Group -</option>");
            $("select#client_group").selectmenu('disable').selectmenu('refresh', true);
            $("select#site").html("<option value=\"\">- Select Site Location -</option>");
            $("select#site").selectmenu('disable').selectmenu('refresh', true);
            break;
          case $(e.currentTarget).val().length > 0:
          default:
            var client_groups_array = Object.keys(self.reordered_sites[$(e.currentTarget).val()]);
            if (1 == client_groups_array.length ){
              if ("null" == client_groups_array[0]){
                $("select#client_group").html("<option value=\"null\"></option>");
                $("select#client_group").selectmenu('disable').selectmenu('refresh', true);
              } else {
                $("select#client_group").html("<option value=\""+ client_groups_array[0] +"\">"+ client_groups_array[0] +"</option>");
                $("select#client_group").selectmenu('enable').selectmenu('refresh', true);
              }

              var sites_options,
                  client_group_sites_arr = self.reordered_sites[$(e.currentTarget).val()][ client_groups_array[0] ];

              if ( 1 == client_group_sites_arr.length ){
                sites_options = "<option value=\""+ client_group_sites_arr[0].site_id +"\">"+ client_group_sites_arr[0].site +"</option>";
              } else {
                sites_options = "<option value=\"\">- Select Site Location -</option>";
                $.each(client_group_sites_arr, function(i,v){
                  sites_options = sites_options + "<option value=\""+ v.site_id +"\">"+ v.site +"</option>";
                });
              }
              $("select#site").html(sites_options);
              $("select#site").selectmenu('enable').selectmenu('refresh', true);
            } else {
              var client_groups_options = "<option value=\"\">- Select Client Group -</option>";
              $.each(client_groups_array, function(i,v){
                client_groups_options = client_groups_options + "<option value=\""+ v +"\">"+ v +"</option>";
              });
              $("select#client_group").html(client_groups_options);
              $("select#client_group").selectmenu('enable').selectmenu('refresh', true);

              $("select#site").html("<option value=\"\">- Select Site Location -</option>");
              $("select#site").selectmenu('disable').selectmenu('refresh', true);
            }
            break;
        }
      } else if ("client_group" == $(e.currentTarget).attr("id")){
        switch (true) {
          case $(e.currentTarget).val().length == 0:
            $("select#site").html("<option>- Select Site Location -</option>");
            $("select#site").selectmenu('disable').selectmenu('refresh', true);
            break;
          case $(e.currentTarget).val().length > 0:
          default:
              var sites_options="",
                  sites_arr = self.reordered_sites[$("select#client").val()][$(e.currentTarget).val()];
              if (1 == sites_arr.length){
                sites_options = "<option value=\""+ sites_arr[0].site_id +"\">"+ sites_arr[0].site +"</option>";
              } else {
                sites_options = "<option value=\"\">- Select Site Location -</option>";
                $.each(sites_arr, function(i,v){
                  sites_options = sites_options + "<option value=\""+ v.site_id +"\">"+ v.site +"</option>";
                });
              }
              $("select#site").html(sites_options);
              $("select#site").selectmenu('enable').selectmenu('refresh', true);
            break;
        }
      }

      if ($("select#site").val().length>0){
        var site_info = (function(){
          var site = {};
          $.each(self.reordered_sites[$("select#client").val()][("" == $("select#client_group").val())?"null":$("select#client_group").val()], function(i,v){
            if ($("select#site").val() == v.site_id){
              site = v;
            }
            return false;
          });
          return site;
        })();
        $(".order_form_selection dd").each(function(i, elm){
          var obj_key_prefix = $(elm).parent().attr('class') + "_" + $(elm).closest("div.start_order").attr('id');
          var val = "";
          $.each(Object.keys(site_info), function(i,v){
            if (RegExp(obj_key_prefix,'i').test(v)){
              val = site_info[v];
              return false;
            }
          });
          if ("" !== val){
            $(elm).text(val + "$");
          }
        });

        $(".order_form_selection .remain>dd").each(function(i, elm){
          var res = "";
          res = parseFloat( $(".budget>dd", $(elm).closest("div")).text() ) - parseFloat( $(".used>dd", $(elm).closest("div")).text() );
          if ("" !== res)
            $(elm).text(res + "$");
        });
      } else {
        $(".order_form_selection dd").html("&nbsp;");
      }

    });


    this.el.on('click', ".log_back", function(e){
      e.preventDefault();
      app.activeOrder(false);
      app.route({
        toPage: window.location.href + "#orders"
      });
    });

    this.el.on('click', "button.start_new_order", function(e){
      if ($("select#site").val() == ""){
        alert("select site");
      } else {
        setTimeout(function(){
          app.route({
            toPage: window.location.href + "#order:new_on_device_" +
                $(e.currentTarget).closest("div.start_order").attr("id") +
                "_" + $("select#site").val() + "_" + (new Date()).getTime()
          });
        },0);
      }
    });

    this.el.on('click', "button#add_new_item", function(e){
      setTimeout(function(){
        app.route({
          toPage: window.location.href + "#addOrderItem:" + $(e.currentTarget).attr("data-value")
        });
      },0);
    });

    this.el.on('click', "button#save_draft", function(e){
      var activeOrder = app.activeOrder();

//      alert("save draft with order_id: " + self.order_id);
//      alert("mutations: " + JSON.stringify(app.ids_mutation()));
//      alert(JSON.stringify(activeOrder));

      if(String(self.order_id) == String(activeOrder.id) && !isObjectsEqual(activeOrder.proto, activeOrder.upd)){
        var drafts = app.mySupplyOrdersDrafts(),
            mutation = app.ids_mutation();
        if ( RegExp('^new_on_device_','i').test(activeOrder.id) && $.inArray(String(activeOrder.id), Object.keys(mutation)) < 0 &&
            (function(){var _tmp = [];_tmp = $.grep(drafts, function(n,i){return n.id == String(activeOrder.id)});return !(_tmp.length>0);})() ){
          drafts.push($.extend({
            id: activeOrder.upd.supply_order_id,
            supply_order_id: activeOrder.upd.supply_order_id,
            supply_order_name: activeOrder.upd.supply_order_name,
            updated_at: activeOrder.upd.updated_at,
            order_date: activeOrder.upd.order_date,
            order_form: activeOrder.upd.order_form,
            site_id: activeOrder.upd.site_id,
            site_name: activeOrder.upd.site_name,
            site_address: activeOrder.upd.site_address,
            special_instructions: [],
            remaining_budget: activeOrder.upd.remaining_budget
          },{
            locally_saved: activeOrder.upd
          }));
        } else {
          $.each(drafts, function(i, dr){
            if ($.inArray(String(dr.supply_order_id), [String(self.order_id), (undefined == mutation[self.order_id])? null : String(mutation[self.order_id])] ) > -1 ){
              var _tmp = activeOrder.upd,
                  draft_to_update = dr;
              if (undefined != mutation[self.order_id]){
                draft_to_update.supply_order_id = mutation[self.order_id];
                draft_to_update.id = mutation[self.order_id];
                _tmp.supply_order_id = mutation[self.order_id];
              }
              draft_to_update['locally_saved'] = _tmp;
              drafts[i] = draft_to_update;
              return false;
            }
          });
        }

//        alert("new drafts to update local storage: " + JSON.stringify(drafts));

        app.mySupplyOrdersDrafts(drafts);
        app.sync_supply();
      }

      setTimeout(function(){
        alert("draft saved");
        app.route({
          toPage: window.location.href + "#orders"
        });
      },0);
    });

    this.el.on('click', "button#submit_to_vendor", function(e){
      navigator.notification.confirm(
          "Are you sure you want to submit order to vendor?",
          function(buttonIndex){
            if(2 == buttonIndex){
              (function(){
                var mySupplyOrdersDrafts = app.mySupplyOrdersDrafts(),
                    myLastSubmittedOrders = app.myLastSubmittedOrders(),
                    submitted_item = {};
                app.mySupplyOrdersDrafts((function(){
                  $.each(mySupplyOrdersDrafts, function(i,v){
                    if(app.activeOrder().id == v.supply_order_id){
                      submitted_item = v;
                      mySupplyOrdersDrafts[i]['submit_status'] = 'submitting';
                      return false;
                    }
                  });
                  return mySupplyOrdersDrafts;
                })());

                app.myLastSubmittedOrders((function(submitted_item){
                  if (!$.isEmptyObject(submitted_item)){
                    myLastSubmittedOrders.unshift(submitted_item);
                    myLastSubmittedOrders.pop();
                  }
                  return myLastSubmittedOrders;
                })(submitted_item));

                app.sync_supply();
                app.route({
                  toPage: window.location.href + "#orders"
                });
              })();
            }
          },
          "Submit order to vendor",
          'Cancel,Submit'
      );
    });

    this.el.on('change', 'textarea#special_instructions', function(e){
      var activeOrder = app.activeOrder();
      activeOrder.upd.special_instructions = $(e.currentTarget).val();
      app.activeOrder((function(){
        activeOrder.proto = activeOrder.upd;
        return activeOrder;
      })());
    });
  };

  this.initialize();
}

Handlebars.registerHelper("newOrderStartContent", function(order){
  var out = "";
  if ($.isEmptyObject(order)){
    out = out + "<div data-role=\"content\" class=\"select_location\">";
    var my_sites = app.mySites(),
        clients = (function(){
      var arr = [];
      $.each(my_sites, function(i, value){
        if ($.inArray(value.client, arr) < 0){
          arr.push(value.client);
        }
      });
      return arr;
    })();
    var order_forms = (function(){
      var arr = [];
      $.each(app.supplyOrdersTemplate(), function(i, value){
        if ($.inArray(value.order_form, arr) < 0){
          arr.push(value.order_form);
        }
      });
      return arr;
    })();

    out = out + "<select name=\"client\" id=\"client\">";
    out = out + "<option value=\"\">- Select Client -</option>";
    $.each(clients, function( index, value ) {
      out = out + "<option value=\"" + value + "\">" + value + "</option>";
    });
    out = out + "</select>";
    out = out + "<select disabled=\"disabled\" name=\"client_group\" id=\"client_group\"><option value=\"\">- Select Client Group -</option></select>";
    out = out + "<select disabled=\"disabled\" name=\"client_site\" id=\"site\"><option value=\"\">- Select Site Location -</option></select>";

    out = out + "<div data-role=\"content\" class=\"order_form_selection\">";
    $.each(order_forms, function(i,v){
      out = out + "<div id=\""+ v.match(/^(.+?)\W/)[1].toLowerCase() +"\" class=\"box start_order\">" +
          "<div role=\"heading\" class=\"boxheader\">"+ v +"</div>" +
          "<div class=\"boxpoints\">" +
            "<div class=\"boxcnt\">" +
              "<dl class=\"budget\"><dt>Budget:</dt><dd>&nbsp;</dd></dl>" +
              "<dl class=\"used\"><dt>Used:</dt><dd>&nbsp;</dd></dl>" +
              "<dl class=\"remain\"><dt>Remaining:</dt><dd>&nbsp;</dd></dl>" +
            "</div>" +
            "<div class=\"box_rightcnt\">" +
              "<button class=\"start_new_order\">Start</button>" +
            "</div>" +
          "</div>" +
        "</div>";
    });
    out = out + "</div></div>";
  }

  return new Handlebars.SafeString(out);
});

Handlebars.registerHelper("orderContent", function(order_obj){
  var out = "";
  if (!$.isEmptyObject(order_obj) && "undefined" != order_obj.id){
    var order = order_obj.upd,
        not_empty_items = false;

    out = out + "<div data-role=\"content\""+ (("log" != order.order_status)? ' class=\"categories\"' : '') +">";
    out = out + "<div class=\"location_details\">";
    out = out + "<p><font>"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>";
    out = out + "<p>Order type: <span>"+order.order_form+"</span>";
    if ("draft" == order.order_status){
      out = out + "<br /><strong>Budget: <span>"+order.remaining_budget+"$</span></strong>";
    }
    out = out + "</p>";
    out = out + "</div>";

    if ("log" != order.order_status){
      out = out + "<div class=\"all_input stnd_btn\">";
      out = out + "<button id=\"add_new_item\" data-value=\""+ order_obj.id +"\" type=\"button\" class=\"ui-btn-hidden\" aria-disabled=\"false\">Add New Item</button>";
      out = out + "</div>";
    }

    $.each(Object.keys(order.supply_order_categories), function(i,v){
      var category_out = "",
          empty_flag = true,
          category = order['supply_order_categories'][v];
      empty_flag = true,

      $.each(Object.keys(category), function(ik,vk){
        var item = category[vk];
        if (item.amount > 0){
          category_out = category_out + "<li>";
          if ("log" != order.order_status){
            category_out = category_out + "<a href=\"#editOrderItem:"+item.item_id+"\">";
          }
          category_out = category_out + "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />";
          category_out = category_out + "<span>" + item.serial_number +"<br />"+ item.description +"<br/>"+ item.measurement +"<br/>"+
              "<div class=\"detals\">Price: $"+item.price+"</div><div class=\"detals\">Amount: "+item.amount+"</div><div class=\"detals\">Total: $"+(item.price*item.amount).toFixed(2)+"</div>";
          if ("log" != order.order_status){
            category_out = category_out + "</a>";
          }
          category_out = category_out + "</li>";
          empty_flag = false;
          not_empty_items = true;
        }
      });
      if (!empty_flag)
        out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li data-role=\"list-divider\" role=\"heading\">"+ v +"</li>" + category_out + "</ul>";
    });

    if (!not_empty_items){
      out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li>No Supply Items</li></ul>";
    } else {
      if ("log" != order.order_status){
        out = out + "<div class=\"all_input  stnd_btn\">";
        out = out + "<button id=\"add_new_item\" data-value=\""+ order_obj.id +"\" type=\"button\" class=\"ui-btn-hidden\" aria-disabled=\"false\">Add New Item</button>";
        out = out + "</div>";
      }

    }


    //over budget
//    out = out + "<div class=\"over_budget\">";
//    out = out + "<span>Over Budget!!!</span>";
//    out = out + "<div class=\"total\">";
//    out = out + "<p>Total: <span class=\"price\">$???</span></p>";
//    out = out + "</div>";
//    out = out + "</div>";

    // Special Instructions

    if ("log" != order.order_status){
      out = out +"<h3>Special Instructions</h3><div class=\"block-textarea\">";
      out = out + "<textarea id=\"special_instructions\" name=\"special_instructions\">" + order.special_instructions + "</textarea>";
    } else {
      out = out +"<div class=\"location_details\">";
      out = out +"<p><font>Special Instructions</font></p>";
      out = out + "<p>" + order.special_instructions + "</p>";
      out = out +"</div>";
    }

    out = out +"</div>";

    if ("log" != order.order_status){
      out = out + "<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
      out = out + "<td class=\"green_btn btnbox_1\"><button id=\"save_draft\">Save as Draft</button></td><td width=\"2%\">&nbsp;</td><td class=\"green_btn\"><button id=\"submit_to_vendor\">Submit to Vendor</button></td>";
      out = out + "</tr></table>";
    }
    out = out + "</div>";
  }
  return new Handlebars.SafeString(out);
});

OrderView.template = Handlebars.compile($("#order-tpl").html());