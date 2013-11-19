var OrderView = function(order_id){
  this.order_id = order_id || "new";
  this.reordered_sites = {};
  this.activeOrder = {};

  this.render = function(){
    var context = {},
        self = this;
    context.userInfo = app.getUserInfo();
    context.version = app.application_build + " " + app.application_version;
    context.order = {};

    if ("new" == self.order_id){
      context.title = "New Order";
      context.new = "new";
      context.backTitle = "Cancel";
    } else {
      context.title = "Order Details";

      var _old_order_id = self.order_id,
          drafts = app.mySupplyOrdersDrafts(),
          logs = app.myLastSubmittedOrders(),
          ids_in_ls = (function(){
            var return_arr = [];
            return_arr = $.merge($.merge(return_arr, $.map(drafts, function(d){return d.supply_order_id;})),
                $.map(logs, function(l){return l.supply_order_id;}));
            return return_arr;
          })(),
          mutations_obj = app.ids_mutation();

      self.activeOrder = app.activeOrder();

      if (!$.isEmptyObject(mutations_obj)){
        if ($.inArray(self.order_id, Object.keys(mutations_obj))>-1){
          self.order_id = mutations_obj[self.order_id];
          mutations_obj[_old_order_id] = void 0;
          delete mutations_obj[_old_order_id];
        }
      }

      if (!$.isEmptyObject(mutations_obj)){
        for(var cnt = 0; cnt<Object.keys(mutations_obj).length; cnt++){
          var key = Object.keys(mutations_obj)[cnt];
          if ( $.inArray(key, ids_in_ls) < 0 ){
            mutations_obj[key] = void 0;
            delete mutations_obj[key];
          }
        }
      }

      context.order = (function(){

        if ($.isEmptyObject(self.activeOrder) || undefined == self.activeOrder.id || $.inArray( self.activeOrder.id, [self.order_id, _old_order_id] ) < 0 ){
          // впервые открываем любой драфт, как вновь созданный, так и уже существкющий

          var obj = {};

          if (RegExp('^new_on_device_','i').test(self.order_id) &&
              ($.grep(drafts, function(n,i){return $.inArray(n.id, [_old_order_id,self.order_id ])>-1 })).length < 1){
            // вновь созданный драфт, не сохраненный еще в ЛС

            var site_info = (function(id_arr){
                  var site_id = id_arr[2],
                      my_sites = app.mySites(),
                      tmp = {};

                  $.each(my_sites, function(i,s){
                    if (site_id == s.site_id){
                      tmp = s;
                      return false;
                    }
                  });

                  if ($.isEmptyObject(tmp)){
                    return {
                      site_id: "",
                      site_name: "Diamond Corporate Office",
                      site_address: "2249 N. Hollywood Way, Burbank CA 91505",
                      remaining_budget: (function(form_prefix){
                        var val = 0;
                        if ("discretionary" == form_prefix) {
                          val = parseFloat(my_sites[0]["budget_discretionary"]) - parseFloat(my_sites[0]["used_discretionary"]);
                        }
                        return val.toFixed(2);
                      })(id_arr[1])
                    }
                  } else {
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
                    self.activeOrder = {};
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
            self.activeOrder = app.activeOrder($.extend({
              id: self.order_id,
              status: obj.order_status
            }, {
              proto: (obj.order_status == "new") ? {} : obj,
              upd: obj
            }));
          }
        } else {
          // возвращаемся со страницы добавления/редактирования айтема

          self.activeOrder = app.activeOrder((function(){
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
              proto: muted(self.activeOrder.proto),
              upd: muted(self.activeOrder.upd)
            })
          })());
        }
//          alert("activeOrder on the end of content rendering: " + JSON.stringify(activeOrder));
        return self.activeOrder;
      })();

      try {
        context.backTitle = (context.order.upd.order_status == "log") ? "Back" : "Cancel";
      } catch(e) {}
      context.backTitle = "Cancel";
    }

    this.el.html(OrderView.template(context));
    return this;
  };

  this.close_popup = function(){
    $(".popup-overlay").remove();
    $(".pop_up > input[type=hidden]").val("");
    $(".pop_up").css("visibility", "hidden");
    return this;
  };

  this.recalculate_total = function(){
    var self = this,
        total = 0,
        category,
        item;

    $.each(Object.keys(self.activeOrder.upd.supply_order_categories), function(i,v){
      category = self.activeOrder.upd.supply_order_categories[v];
      $.each(Object.keys(category), function(ik,vk){
        item = category[vk];
        if(parseFloat(item.amount) > 0){
          total = total + (parseFloat(item.price) * parseFloat(item.amount));
        }
      });
    });

    if (parseFloat(self.activeOrder.upd.remaining_budget) > parseFloat(total)){
      $(".over_budget > span").css("visibility", "hidden");
    } else {
      $(".over_budget > span").css("visibility", "visible");
    }
    $("div.over_budget span.price").text("$" + total.toFixed(2));
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

    this.el.on("change", "select[name=client_site]", function(e){
      var my_sites = app.mySites();

      if ($("select#site").val().length>0){
        var site_info = $.grep(my_sites, function(n,i){
          return String(n.site_id) == String($("select#site").val())}
        )[0];

        $(".order_form_selection>.site_dependent dd").each(function(i, elm){
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

        $(".order_form_selection>.site_dependent .remain>dd").each(function(i, elm){
          var res = "";
          res = parseFloat( $(".budget>dd", $(elm).closest("div")).text().substring(1) ) -
              parseFloat( $(".used>dd", $(elm).closest("div")).text().substring(1) );
          res = res.toFixed(2);
          if ("" !== res)
            $(elm).text("$" + res);
        });
      } else {
        $(".order_form_selection>.site_dependent dd").html("&nbsp;");
      }
    });

    this.el.on('click', ".log_back", function(e){
      e.preventDefault();
      app.backButton();
    });

    this.el.on('click', "button.start_new_order", function(e){
      if ($("select#site").val() == "" && "discretionary" != $(e.currentTarget).closest("div.start_order").attr("id") ){

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
                "_" + ((""!=$("select#site").val())? $("select#site").val() : '0000') + "_" + (new Date()).getTime()
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

      navigator.notification.confirm(
          "Do you want to save this order as draft?",
          function(buttonIndex){
            if(2 == buttonIndex){
              if(String(self.order_id) == String(self.activeOrder.id) && !isObjectsEqual(self.activeOrder.proto, self.activeOrder.upd)){
                var drafts = app.mySupplyOrdersDrafts(),
                    mutation = app.ids_mutation();
                if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                    (function(){var _tmp = [];_tmp = $.grep(drafts, function(n,i){return n.id == String(self.activeOrder.id)});return !(_tmp.length>0);})() ){
                  // новый черновик, не присутствующий в ЛС, добавляем его туда


                  drafts.unshift($.extend({
                    id: self.activeOrder.upd.supply_order_id,
                    supply_order_id: self.activeOrder.upd.supply_order_id,
                    supply_order_name: self.activeOrder.upd.supply_order_name,
                    updated_at: self.activeOrder.upd.updated_at,
                    order_date: self.activeOrder.upd.order_date,
                    order_form: self.activeOrder.upd.order_form,
                    site_id: self.activeOrder.upd.site_id,
                    site_name: self.activeOrder.upd.site_name,
                    site_address: self.activeOrder.upd.site_address,
                    special_instructions: self.activeOrder.upd.special_instructions,
                    remaining_budget: self.activeOrder.upd.remaining_budget
                  },{
                    locally_saved: self.activeOrder.upd
                  }));
                } else {
                  $.each(drafts, function(i, dr){
                    if ($.inArray(String(dr.supply_order_id), [String(self.order_id), (undefined == mutation[self.order_id])? null : String(mutation[self.order_id])] ) > -1 ){
                      var draft_to_update = {};

                      if (undefined != mutation[self.order_id]){
                        self.activeOrder.upd.supply_order_id = mutation[self.order_id];
                        self.activeOrder.upd.id = mutation[self.order_id];
                      }

                      draft_to_update = $.extend({
                        id: self.activeOrder.upd.supply_order_id,
                        supply_order_id: self.activeOrder.upd.supply_order_id,
                        supply_order_name: self.activeOrder.upd.supply_order_name,
                        updated_at: self.activeOrder.upd.updated_at,
                        order_date: self.activeOrder.upd.order_date,
                        order_form: self.activeOrder.upd.order_form,
                        site_id: self.activeOrder.upd.site_id,
                        site_name: self.activeOrder.upd.site_name,
                        site_address: self.activeOrder.upd.site_address,
                        special_instructions: self.activeOrder.upd.special_instructions,
                        remaining_budget: self.activeOrder.upd.remaining_budget
                      },{
                        locally_saved: self.activeOrder.upd
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
                self.activeOrder = {};
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
      var _total = parseFloat($(".over_budget span.price").text().substring(1));

      if ( _total > 0) {

        if (_total > parseFloat(self.activeOrder.upd.remaining_budget)){
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
                if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                    (function(){var _tmp = [];_tmp = $.grep(mySupplyOrdersDrafts, function(n,i){return n.id == String(self.activeOrder.supply_order_id)});return !(_tmp.length>0);})() ){

                  mySupplyOrdersDrafts.unshift($.extend({
                    id: self.activeOrder.upd.supply_order_id,
                    supply_order_id: self.activeOrder.upd.supply_order_id,
                    supply_order_name: self.activeOrder.upd.supply_order_name,
                    updated_at: self.activeOrder.upd.updated_at,
                    order_date: self.activeOrder.upd.order_date,
                    order_form: self.activeOrder.upd.order_form,
                    site_id: self.activeOrder.upd.site_id,
                    site_name: self.activeOrder.upd.site_name,
                    site_address: self.activeOrder.upd.site_address,
                    special_instructions: self.activeOrder.upd.special_instructions,
                    remaining_budget: self.activeOrder.upd.remaining_budget
                  },{
                    locally_saved: self.activeOrder.upd
                  }, {
                    order_status:"log"
                  }));
                }

                app.mySupplyOrdersDrafts((function(){
                  $.each(mySupplyOrdersDrafts, function(i,v){
                    if(String(self.activeOrder.upd.supply_order_id) == String(v.supply_order_id)){

                      mySupplyOrdersDrafts[i] = $.extend({
                        id: self.activeOrder.upd.supply_order_id,
                        supply_order_id: self.activeOrder.upd.supply_order_id,
                        supply_order_name: self.activeOrder.upd.supply_order_name,
                        updated_at: self.activeOrder.upd.updated_at,
                        order_date: self.activeOrder.upd.order_date,
                        order_form: self.activeOrder.upd.order_form,
                        site_id: self.activeOrder.upd.site_id,
                        site_name: self.activeOrder.upd.site_name,
                        site_address: self.activeOrder.upd.site_address,
                        special_instructions: self.activeOrder.upd.special_instructions,
                        remaining_budget: self.activeOrder.upd.remaining_budget
                      },{
                        locally_saved: self.activeOrder.upd
                      }, {
                        submit_status: "submitting"
                      },{
                        order_status:"log"
                      });
                      submitted_item = mySupplyOrdersDrafts[i];
                    }
                    if (self.activeOrder.upd.order_form == v.order_form && self.activeOrder.upd.site_id == v.site_id){
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
                  self.activeOrder = {};
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
      self.activeOrder.upd.special_instructions = $(e.currentTarget).val();
//      app.activeOrder(self.activeOrder);
    });

    this.el.on('click', 'ul[data-role=listview] li a', function(e){
      e.preventDefault();

      var $popup = $(".pop_up");
      var $overlay = $("<div />", {
        class: "popup-overlay"
      }).on("click", function(ev){
        ev.preventDefault();
        self.close_popup();
      });

      try {
        $overlay.appendTo("body").trigger("create");
        $("input[type=hidden][id=item_id]", $popup).val($(e.currentTarget).attr("id"));
        $popup.css( "left",  Math.round( ($(window).width() - $popup.width())/2 ) );

        if ($popup.height() > ($(window).height() - 30)){
          $popup.css("top", $(document).scrollTop() + parseInt(25) + "px");
        } else {
          $popup.css("top", $(document).scrollTop() + Math.round(($(window).height() - $popup.height())/2) + "px");
        }
        $popup.css("visibility","visible");
      } catch (er){}
    });

    this.el.on('click', '.pop_up .close', function(e){
      e.preventDefault();
      self.close_popup();
    });

    this.el.on('click', '.pop_up .popup_content a, .pop_up a.clear', function(event){
      event.preventDefault();
      if (!$(event.currentTarget).hasClass('disabled')){
        var $clicked_elm = $("a[id='"+$(".pop_up>input[type=hidden][id=item_id]").val()+"']");
        try {
          var clicked_category = $("li[data-role=list-divider]", $clicked_elm.closest("ul")).text();
          var elm_id = $clicked_elm.attr("id").match(/^iid_(.*)$/i)[1];
          var details_arr = $(".detals", $clicked_elm);

          self.activeOrder['upd']['supply_order_categories'][clicked_category][elm_id]['amount'] =
              $(event.currentTarget).attr("data-value");

          $(details_arr[1]).text("Amount: " + $(event.currentTarget).attr("data-value"));
          $(details_arr[2]).text("Total: $" + (parseFloat($(event.currentTarget).attr("data-value"))*
              parseFloat(self.activeOrder['upd']['supply_order_categories'][clicked_category][elm_id]["price"])).toFixed(2) );
        } catch(er){}
      }
      setTimeout(function(){
        self.recalculate_total().close_popup();
      }, 0);
    });

  };

  this.initialize();
}

Handlebars.registerHelper("newOrderStartContent", function(order){
  var out = "";
  if ($.isEmptyObject(order)){

    out = out + "<div style=\"padding: 15px 10px 0 0\"><h5>Supply Period: <font>"+
        (function(){
          var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
          var formattedDate = new Date();
          return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
        })() +
        "</font></h5></div>";

    out = out + "<div data-role=\"content\" class=\"select_location\">";
    var my_sites = app.mySites(),
        current_order_type,
        order_forms = (function(){
          var arr = [];
          $.each(app.supplyOrdersTemplate(), function(i, value){
            if ($.inArray(value.order_form, arr) < 0){
              arr.push(value.order_form);
            }
          });
          return arr;
        })(),
        discretionary_budget_info = (function(){
          return {
            budget_discretionary: parseFloat(my_sites[0]["budget_discretionary"]).toFixed(2),
            used_discretionary: parseFloat(my_sites[0]["used_discretionary"]).toFixed(2),
            remain_discretionary: (parseFloat(my_sites[0]["budget_discretionary"]) - parseFloat(my_sites[0]["used_discretionary"])).toFixed(2)
          }
        })();

    out = out + "<select name=\"client_site\" id=\"site\"><option value=\"\">- Select Site Location -</option>";
    $.each(my_sites, function( index, value ) {
      out = out + "<option value=\"" + value.site_id + "\">" + value.site + "</option>";
    });
    out = out + "</select>";

    out = out + "<div data-role=\"content\" class=\"order_form_selection\">";
    $.each(order_forms, function(i,v){
      current_order_type = v.match(/^(.+?)\b/)[1].toLowerCase();
      out = out + "<div id=\""+ current_order_type +"\" class=\"box start_order"+ (("discretionary" != current_order_type)?' site_dependent':'') +"\">" +
          "<div role=\"heading\" class=\"boxheader\">"+ v +"</div>" +
          "<div class=\"boxpoints\">" +
            "<div class=\"boxcnt\">" +
              "<dl class=\"budget\"><dt>Budget:</dt><dd>"+ (("discretionary" != current_order_type)?'&nbsp;':('$'+discretionary_budget_info.budget_discretionary)) +"</dd></dl>" +
              "<dl class=\"used\"><dt>Used:</dt><dd>"+ (("discretionary" != current_order_type)?'&nbsp;':('$'+discretionary_budget_info.used_discretionary)) +"</dd></dl>" +
              "<dl class=\"remain\"><dt>Remaining:</dt><dd>"+ (("discretionary" != current_order_type)?'&nbsp;':('$'+discretionary_budget_info.remain_discretionary)) +"</dd></dl>" +
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
/*        not_empty_items = false,*/
        total = 0;

    out = out + "<div data-role=\"content\""+ (("log" != order.order_status)? ' class=\"categories\"' : '') +">";
    out = out + "<div class=\"location_details\">";
    out = out + "<p><font>Order: "+ ((/^new_on_device/ig).test(order.supply_order_id)? '<em>sync required</em>': ('<strong>#' + order.supply_order_id + '</strong> from <strong>'+ (('' != order.order_date) ? order.order_date : '-') +'</strong>'));
    out = out + "<br />"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>";
    out = out + "<p>Order type: <span>"+order.order_form+"</span>";
    if ("log" != order.order_status){
      out = out + "<br /><strong>Remaining Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span></strong>";
    }
    out = out + "<br />"+(("log" != order.order_status)?'Draft saved':'Submitted' )+": <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>";
    out = out + "</p>";
    out = out + "</div>";

/*    if ("log" != order.order_status){
      out = out + "<div class=\"all_input stnd_btn\">";
      out = out + "<button id=\"add_new_item\" data-value=\""+ order_obj.id +"\" type=\"button\" class=\"ui-btn-hidden\" aria-disabled=\"false\">Add New Item</button>";
      out = out + "</div>";
    }*/

    $.each(Object.keys(order.supply_order_categories), function(i,v){
      var category_out = "",
          empty_flag = true,
          category = order['supply_order_categories'][v];

      $.each(Object.keys(category), function(ik,vk){
        var item = category[vk],
            price = parseFloat(item.price),
            amount = parseFloat(item.amount),
            _total = price * amount;

//        if (amount > 0 ){
        if ("log" != order.order_status || amount > 0){

          category_out = category_out + "<li>";
          if ("log" != order.order_status){
            category_out = category_out + "<a id=\"iid_"+item.item_id+"\" href=\"#editOrderItem:"+item.item_id+"\">";
            category_out = category_out + "<img src=\"css/images/icons_0sprite.png\" class=\"ui-li-thumb\" />";
          }
          category_out = category_out +
              "<span>" + item.serial_number +" - "+ item.description +"<br/>Measurement: "+ item.measurement +"<br/>" +
              "<div class=\"detals\">Price: $"+ price.toFixed(2) + "</div>" +
              "<div class=\"detals\">Amount: "+ amount + "</div>" +
              "<div class=\"detals\">Total: $"+ _total.toFixed(2) + "</div>" +
            "</span>";

          if ("log" != order.order_status){
            category_out = category_out + "</a>";
          }
          category_out = category_out + "</li>";
          empty_flag = false;
/*          not_empty_items = true;*/
          total = total + _total;

        }
//        }

      });
      if (!empty_flag)
        out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li data-role=\"list-divider\" role=\"heading\">"+ v +"</li>" + category_out + "</ul>";
    });

    /*if (!not_empty_items){
      out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li>No Supply Items</li></ul>";
    } else {
      if ("log" != order.order_status){
        out = out + "<div class=\"all_input  stnd_btn\">";
        out = out + "<button id=\"add_new_item\" data-value=\""+ order_obj.id +"\" type=\"button\" class=\"ui-btn-hidden\" aria-disabled=\"false\">Add New Item</button>";
        out = out + "</div>";
      }
    }*/

    //over budget
    out = out + "<div class=\"over_budget\">";
    out = out + "<span style=\"visibility:" + ((total>order.remaining_budget && "log" != order.order_status)?'visible':'hidden') + ";\">Over Budget!!!</span>";
    out = out + "<div class=\"total\">";
    out = out + "<p>Total: <span class=\"price\">$"+total.toFixed(2)+"</span></p>";
    out = out + "</div>";
    out = out + "</div>";

    // Special Instructions

    if ("log" != order.order_status){
      out = out +"<h3>Special Instructions:</h3><div class=\"block-textarea\">";
      out = out + "<textarea id=\"special_instructions\" name=\"special_instructions\">" + order.special_instructions + "</textarea>";
    } else if ($.trim(order.special_instructions).length > 0) {
      out = out +"<div class=\"location_details\">";
      out = out +"<p><font>Special Instructions:</font></p>";
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