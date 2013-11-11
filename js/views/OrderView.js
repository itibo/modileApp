var OrderView = function(order_id){
  this.order_id = order_id || "new";
  this.reordered_sites = {};

  this.render = function(){
    var context = {},
        self = this;
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.order = {};
//    alert("order_id on load: " + self.order_id);
    if ("new" == self.order_id){
      context.title = "New Order";
      context.new = "new";
      context.backTitle = "Cancel";
    } else {
      context.title = "Order Details";

      (function(mutations_obj){
        var activeOrder = app.activeOrder(),
            _old_order_id = self.order_id,
            drafts = app.mySupplyOrdersDrafts(),
            logs = app.myLastSubmittedOrders(),
            ids_in_ls = (function(){
              var return_arr = [];
              return_arr = $.merge($.merge(return_arr, $.map(drafts, function(d){return d.supply_order_id;})),
                  $.map(logs, function(l){return l.supply_order_id;}));
              return return_arr;
            })();

        if ($.inArray(self.order_id, Object.keys(mutations_obj))>-1){
          self.order_id = mutations_obj[self.order_id];
          mutations_obj[_old_order_id] = void 0;
        }

        for(var cnt = 0; cnt>mutations_obj.length; cnt++){
          var key = Object.keys(mutations_obj)[cnt];
          if ( $.inArray(key, ids_in_ls) < 0 ){
            mutations_obj[key] = void 0;
          }
        }

        context.order = (function(){

          if ($.isEmptyObject(activeOrder) || undefined == activeOrder.id || $.inArray( activeOrder.id, [self.order_id, _old_order_id] ) < 0 ){
            // впервые открываем любой драфт, как вновь созданный, так и уже существкющий

            var obj = {};

            if (RegExp('^new_on_device_','i').test(self.order_id) &&
                ($.grep(drafts, function(n,i){return $.inArray(n.id, [_old_order_id,self.order_id ])>-1 })).length < 1){
              // вновь созданный драфт, не сохраненный еще в ЛС

              var site_info = (function(id_arr){
                    var site_id = id_arr[2],
                        tmp = {};

                    $.each(app.mySites(), function(i,s){
                      if (site_id == s.site_id){
                        tmp = s;
                        return false;
                      }
                    });

                    return {
                      site_id: tmp.site_id,
                      site_name: tmp.site,
                      site_address: tmp.address,
                      remaining_budget: (function(form_prefix){
                        var budget = $.grep(Object.keys(tmp), function(n,i){
                          return RegExp('^budget_'+ form_prefix +'(\\b|_)','i').test(n);
                        })[0];
                        var used = $.grep(Object.keys(tmp), function(n,i){
                          return RegExp('^used_'+ form_prefix +'(\\b|_)','i').test(n);
                        })[0];
                        var remain = parseFloat(tmp[budget]) - parseFloat(tmp[used]);
                        return parseFloat(remain).toFixed(2);
                      })(id_arr[1])
                    }
                  })(self.order_id.match(/^new_on_device_(.*)_(.*)_(.*)$/)),
                  form_and_items_info = (function(form){
                    var tmp = {},
                        return_obj = {};

                    $.each(app.supplyOrdersTemplate(), function(i,tmpl){
                      if ( RegExp('^'+ form +'\\b','i').test(tmpl.order_form) ){
                        tmp = tmpl;
                        return false;
                      }
                    });

                    return_obj.order_form = tmp.order_form;
                    return_obj.supply_order_categories = {};

                    $.each(tmp.categories, function(i,cat){
                      return_obj['supply_order_categories'][cat.category] = {};
                      $.each(cat.items, function(ik,item){
                        return_obj['supply_order_categories'][cat.category][item.item_id] = $.extend(item, {amount: 0});
                      });
                    });
                    return return_obj;
                  })(self.order_id.match(/^new_on_device_(.+)_(.+)_(.*)$/)[1]);

              obj = $.extend(obj, {
                supply_order_id: self.order_id,
                supply_order_name: "",
                updated_at: "",
                order_date: "",
                special_instructions: ""
              }, site_info, form_and_items_info, {
                order_status: "new"
              });

            } else {
              // открывает драфт/сабмитед ордер из ЛС

              $.each(drafts, function(i,v){
                if (String(self.order_id) == String(v.supply_order_id) &&
                    (undefined == typeof (v.submit_status) || "submitting" != v.submit_status)){
                  obj = $.extend(((undefined != v.locally_saved ) ? v.locally_saved : v), {order_status: "draft"});
                  return false;
                }
              });

              if ($.isEmptyObject(obj)){
                $.each(logs, function(i,v){
                  if (String(self.order_id) == String(v.supply_order_id)){
                    obj = $.extend(((undefined != v.locally_saved ) ? v.locally_saved : v), {order_status: "log"});
                    return false;
                  }
                });
              }
            }

            if ($.isEmptyObject(obj)){
              navigator.notification.alert(
                  "Please re-choose order", // message
                  function(){
                    setTimeout(function(){
                      app.activeOrder(false);
                      app.route({
                        toPage: window.location.href + "#orders"
                      });
                    },0);
                  },   // callback
                  "Error",    // title
                  'Ok'            // buttonName
              );
            } else {
              activeOrder = app.activeOrder($.extend({
                id: self.order_id,
                status: obj.order_status
              }, {
                proto: (obj.order_status == "new") ? {} : obj,
                upd: obj
              }));
            }

          } else {
            // возвращаемся со страницы добавления/редактирования айтема

            activeOrder = app.activeOrder((function(){
              // mutations in action
              var muted = function(obj){
                if (_old_order_id != self.order_id){
                  obj.id = self.order_id
                  obj.supply_order_id = self.order_id
                }
                obj.order_status = obj.order_status || "draft";
                return obj;
              };
              return $.extend({id: self.order_id}, {
                proto: muted(activeOrder.proto),
                upd: muted(activeOrder.upd)
              })
            })());
          }
//          alert("activeOrder on the end of content rendering: " + JSON.stringify(activeOrder));
          return activeOrder;
        })();
        context.backTitle = "Cancel";
        context.backTitle = (context.order.upd.order_status == "log") ? "Back" : "Cancel";
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
          $.each(self.reordered_sites[$("select#client").val()][((0 == $("select#client_group").val().length)?'null':$("select#client_group").val())], function(i,v){
            if ($("select#site").val() == String(v.site_id)){
              site = v;
              return false;
            }
          });
          return site;
        })();

        $(".order_form_selection dd").each(function(i, elm){
          var obj_key_prefix = $(elm).parent().attr('class') + "_" + $(elm).closest("div.start_order").attr('id');
          var val = "";

          $.each(Object.keys(site_info), function(i,v){
            if (RegExp(obj_key_prefix,'i').test(v)){
              val = parseFloat(site_info[v]).toFixed(2);
              return false;
            }
          });
          if ("" !== val){
            $(elm).text("$" + val);
          }
        });

        $(".order_form_selection .remain>dd").each(function(i, elm){
          var res = "";
          res = parseFloat( $(".budget>dd", $(elm).closest("div")).text().substring(1) ) -
              parseFloat( $(".used>dd", $(elm).closest("div")).text().substring(1) );
          res = res.toFixed(2);
          if ("" !== res)
            $(elm).text("$" + res);
        });
      } else {
        $(".order_form_selection dd").html("&nbsp;");
      }

    });


    this.el.on('click', ".log_back", function(e){
      app.backButton();
    });

    this.el.on('click', "button.start_new_order", function(e){
      if ($("select#site").val() == ""){

        navigator.notification.alert(
            "Please, select site to continue.", // message
            function(){},   // callback
            "New Order",    // title
            'Ok'            // buttonName
        );

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

      navigator.notification.confirm(
          "Do you want to save this order as draft?",
          function(buttonIndex){
            if(2 == buttonIndex){
              if(String(self.order_id) == String(activeOrder.id) && !isObjectsEqual(activeOrder.proto, activeOrder.upd)){
                var drafts = app.mySupplyOrdersDrafts(),
                    mutation = app.ids_mutation();
                if ( RegExp('^new_on_device_','i').test(activeOrder.upd.supply_order_id) &&
                    (function(){var _tmp = [];_tmp = $.grep(drafts, function(n,i){return n.id == String(activeOrder.id)});return !(_tmp.length>0);})() ){
                  // новый черновик, не присутствующий в ЛС, добавляем его туда


                  drafts.unshift($.extend({
                    id: activeOrder.upd.supply_order_id,
                    supply_order_id: activeOrder.upd.supply_order_id,
                    supply_order_name: activeOrder.upd.supply_order_name,
                    updated_at: activeOrder.upd.updated_at,
                    order_date: activeOrder.upd.order_date,
                    order_form: activeOrder.upd.order_form,
                    site_id: activeOrder.upd.site_id,
                    site_name: activeOrder.upd.site_name,
                    site_address: activeOrder.upd.site_address,
                    special_instructions: activeOrder.upd.special_instructions,
                    remaining_budget: activeOrder.upd.remaining_budget
                  },{
                    locally_saved: activeOrder.upd
                  }));
                } else {
                  $.each(drafts, function(i, dr){
                    if ($.inArray(String(dr.supply_order_id), [String(self.order_id), (undefined == mutation[self.order_id])? null : String(mutation[self.order_id])] ) > -1 ){
                      var draft_to_update = {};

                      if (undefined != mutation[self.order_id]){
                        activeOrder.upd.supply_order_id = mutation[self.order_id];
                        activeOrder.upd.id = mutation[self.order_id];
                      }

                      draft_to_update = $.extend({
                        id: activeOrder.upd.supply_order_id,
                        supply_order_id: activeOrder.upd.supply_order_id,
                        supply_order_name: activeOrder.upd.supply_order_name,
                        updated_at: activeOrder.upd.updated_at,
                        order_date: activeOrder.upd.order_date,
                        order_form: activeOrder.upd.order_form,
                        site_id: activeOrder.upd.site_id,
                        site_name: activeOrder.upd.site_name,
                        site_address: activeOrder.upd.site_address,
                        special_instructions: activeOrder.upd.special_instructions,
                        remaining_budget: activeOrder.upd.remaining_budget
                      },{
                        locally_saved: activeOrder.upd
                      });

                      drafts[i] = draft_to_update;
                      return false;
                    }
                  });
                }
                app.mySupplyOrdersDrafts(drafts);
                app.sync_supply();
              }

              setTimeout(function(){
                app.activeOrder(false);
                app.route({
                  toPage: window.location.href + "#orders"
                });
              },0);
            }
          },
          "Supply Order",
          'Cancel,Save'
      );

    });

    this.el.on('click', "button#submit_to_vendor", function(e){
      var _total = parseFloat($(".over_budget span.price").text().substring(1)),
          activeOrder = app.activeOrder();

      if ( _total > 0) {

        if (_total > parseFloat(activeOrder.upd.remaining_budget)){
          navigator.notification.alert(
              "Order can't be submitted to vendor since budget is exceeded. Please correct the order details to be in the limits of available budget.", // message
              function(){},    // callback
              "Over budget.",       // title
              'Ok'         // buttonName
          );
        } else {
          navigator.notification.confirm(
            "Do you want to submit this order to Vendor?",
            function(buttonIndex){
              if(2 == buttonIndex){

                var mySupplyOrdersDrafts = app.mySupplyOrdersDrafts(),
                    myLastSubmittedOrders = app.myLastSubmittedOrders(),
                    submitted_item = {};

                // новый черновик, не присутствующий в ЛС, добавляем его туда
                if ( RegExp('^new_on_device_','i').test(activeOrder.upd.supply_order_id) &&
                    (function(){var _tmp = [];_tmp = $.grep(mySupplyOrdersDrafts, function(n,i){return n.id == String(activeOrder.supply_order_id)});return !(_tmp.length>0);})() ){

                  mySupplyOrdersDrafts.unshift($.extend({
                    id: activeOrder.upd.supply_order_id,
                    supply_order_id: activeOrder.upd.supply_order_id,
                    supply_order_name: activeOrder.upd.supply_order_name,
                    updated_at: activeOrder.upd.updated_at,
                    order_date: activeOrder.upd.order_date,
                    order_form: activeOrder.upd.order_form,
                    site_id: activeOrder.upd.site_id,
                    site_name: activeOrder.upd.site_name,
                    site_address: activeOrder.upd.site_address,
                    special_instructions: activeOrder.upd.special_instructions,
                    remaining_budget: activeOrder.upd.remaining_budget
                  },{
                    locally_saved: activeOrder.upd
                  }, {
                    order_status:"log"
                  }));
                }

                app.mySupplyOrdersDrafts((function(){
                  $.each(mySupplyOrdersDrafts, function(i,v){
                    if(String(activeOrder.upd.supply_order_id) == String(v.supply_order_id)){

                      mySupplyOrdersDrafts[i] = $.extend({
                        id: activeOrder.upd.supply_order_id,
                        supply_order_id: activeOrder.upd.supply_order_id,
                        supply_order_name: activeOrder.upd.supply_order_name,
                        updated_at: activeOrder.upd.updated_at,
                        order_date: activeOrder.upd.order_date,
                        order_form: activeOrder.upd.order_form,
                        site_id: activeOrder.upd.site_id,
                        site_name: activeOrder.upd.site_name,
                        site_address: activeOrder.upd.site_address,
                        special_instructions: activeOrder.upd.special_instructions,
                        remaining_budget: activeOrder.upd.remaining_budget
                      },{
                        locally_saved: activeOrder.upd
                      }, {
                        submit_status: "submitting"
                      },{
                        order_status:"log"
                      });
                      submitted_item = mySupplyOrdersDrafts[i];
                    }
                    if (activeOrder.upd.order_form == v.order_form && activeOrder.upd.site_id == v.site_id){
                      mySupplyOrdersDrafts[i]['remaining_budget'] = (parseFloat(v.remaining_budget) -
                          parseFloat($(".over_budget span.price").text().substring(1))).toFixed(2) ;
                    }
                  });
                  return mySupplyOrdersDrafts;
                })());

                app.myLastSubmittedOrders((function(submitted_item){
                  submitted_item = submitted_item.locally_saved;
                  if (!$.isEmptyObject(submitted_item)){
                    myLastSubmittedOrders.unshift(submitted_item);
                    myLastSubmittedOrders.pop();
                  }
                  return myLastSubmittedOrders;
                })(submitted_item));

                app.sync_supply();
                setTimeout(function(){
                  app.activeOrder(false);
                  app.route({
                    toPage: window.location.href + "#orders"
                  });
                }, 0);

              }
            },
            "Supply Order",
            'Cancel,Submit'
          );
        }

      } else {
        navigator.notification.alert(
            "There are no items selected to submit to the vendor.", // message
            function(){},    // callback
            "Supply Order",       // title
            'Ok'         // buttonName
        );
      }

    });

    this.el.on('input propertychange', 'textarea#special_instructions', function(e){
      var activeOrder = app.activeOrder();
      activeOrder.upd.special_instructions = $(e.currentTarget).val();
      app.activeOrder(activeOrder);
    });
  };

  this.initialize();
}

Handlebars.registerHelper("newOrderStartContent", function(order){
  var out = "";
  if ($.isEmptyObject(order)){

    out = out + "<div style=\"padding: 20px 10px 0 0\"><h5>Supply Period: <font>"+
        (function(){
          var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
          var formattedDate = new Date();
          return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
        })() +
        "</font></h5></div>";

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
      out = out + "<div id=\""+ v.match(/^(.+?)\b/)[1].toLowerCase() +"\" class=\"box start_order\">" +
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
        not_empty_items = false,
        total = 0;

    out = out + "<div data-role=\"content\""+ (("log" != order.order_status)? ' class=\"categories\"' : '') +">";
    out = out + "<div class=\"location_details\">";
    out = out + "<p>Order #: <em>"+ ((/^new_on_device/ig).test(order.supply_order_id)? 'N/A': order.supply_order_id)+"</em></p>";
    out = out + "<p><font>"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>";
    out = out + "<p>Order type: <span>"+order.order_form+"</span>";
    out = out + "<br />Order date: <span>"+ (('' != order.order_date) ? order.order_date : 'N/A') +"</span>";
    out = out + "<br />Draft saved: <span>"+ (('' != order.updated_at) ? order.updated_at : 'N/A') +"</span>";
    if ("log" != order.order_status){
      out = out + "<br /><strong>Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span></strong>";
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

      $.each(Object.keys(category), function(ik,vk){
        var item = category[vk],
            price = parseFloat(item.price),
            amount = parseFloat(item.amount),
            _total = price * amount;
        if (amount > 0){
          category_out = category_out + "<li>";
          if ("log" != order.order_status){
            category_out = category_out + "<a href=\"#editOrderItem:"+item.item_id+"\">";
          }
          category_out = category_out + "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />" +
            "<span>" + item.serial_number +" - "+ item.description +"<br/>Measurement: "+ item.measurement +"<br/>" +
              "<div class=\"detals\">Price: $"+ price.toFixed(2)  + "</div>" +
              "<div class=\"detals\">Amount: "+ amount + "</div>" +
              "<div class=\"detals\">Total: $"+ _total.toFixed(2) + "</div>" +
            "</span>";

          if ("log" != order.order_status){
            category_out = category_out + "</a>";
          }
          category_out = category_out + "</li>";
          empty_flag = false;
          not_empty_items = true;
          total = total + _total;
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
    out = out + "<div class=\"over_budget\">";
    out = out + "<span style=\"visibility:" + ((total>order.remaining_budget && "log" != order.order_status)?'visible':'hidden') + ";\">Over Budget!!!</span>";
    out = out + "<div class=\"total\">";
    out = out + "<p>Total: <span class=\"price\">$"+total.toFixed(2)+"</span></p>";
    out = out + "</div>";
    out = out + "</div>";

    // Special Instructions

    if ("log" != order.order_status){
      out = out +"<h3>Special Instructions</h3><div class=\"block-textarea\">";
      out = out + "<textarea id=\"special_instructions\" name=\"special_instructions\">" + order.special_instructions + "</textarea>";
    } else if ($.trim(order.special_instructions).length > 0) {
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