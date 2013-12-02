var OrderView = function(order_id){
  this.order_id = order_id || "new";
  this.activeOrder = {};
  this.scroll_event_obj = false;

  this.render = function(){
    var context = {},
        self = this;

    context.order = {};

    context.subheader = (function(){
      var userInfo = app.getUserInfo();
      var out = "";
      out = out + "<h5><font>" + userInfo.display_name +"</font>, " + userInfo.role + "<br />" +
          "Supply Period: <font>" +
          (function(){
            var monthNames = [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
            var formattedDate = new Date();
            return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
          })() +
          "</font></h5>";
      return out;
    })();


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
        app.ids_mutation(mutations_obj);
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
                        if ("paper" != form_prefix) {
                          val = parseFloat(my_sites[0]["budget_"+form_prefix]) - parseFloat(my_sites[0]["used_"+form_prefix]);
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
              proto: (obj.order_status == "new") ? {} : $.extend(true, {}, obj),
              upd: $.extend(true, {}, obj)
            }));
          }
        } else {
          // возвращаемся со страницы добавления/редактирования айтема или входим после некорректного выхода из редактирования

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
              proto: $.extend(true, {}, muted(self.activeOrder.proto)),
              upd: $.extend(true, {}, muted(self.activeOrder.upd))
            })
          })());
        }
        return self.activeOrder;
      })();

      try {
        context.backTitle = ("log" == context.order.upd.order_status ) ? "Back" : "Cancel";
      } catch(e) {
        context.backTitle = "Cancel";
      }
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

    $(".over_budget>.budget span.remain").html( "$" + parseFloat(self.activeOrder.upd.remaining_budget - total).toFixed(2) );

    if (parseFloat(self.activeOrder.upd.remaining_budget) > parseFloat(total)){
      $(".over_budget .over").html("");
    } else {
      $(".over_budget .over").html("Over Budget!!!");
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
    this.el = $('<div />');

    this.el.on("orderevent", function(e){
      e.preventDefault();
      $("#budget_clone").remove();
      try {
        var budget_position_y = $("div.over_budget").offset().top + $("div.over_budget").outerHeight(),
            win_height = $(window).height(),
            budget_position_width = $("div.over_budget").width();

        budget_elm = $("div.over_budget").clone().attr("id", "budget_clone").css({
          "bottom": 0,
          "margin-bottom": 0,
          "margin-left": 0,
          "position": "fixed",
          "width": Math.floor(budget_position_width) + "px",
          "visibility": "hidden",
          "z-index": 102
        }).appendTo("div.categories[role=main]").trigger('create');

        self.scroll_event_obj = $.extend(self.scroll_event_obj, {
          budget_position_y: budget_position_y,
          win_height: win_height,
          budget_elm: $(budget_elm).attr("id")
        });

        $(window).trigger("scroll");
      } catch (er){self.scroll_event_obj = {};}
    });

    this.el.on("change", "select[name=client_site]", function(e){
      var my_sites = app.mySites();

      if ($("select#site").val().length>0){
        var site_info = $.grep(my_sites, function(n,i){
          return String(n.site_id) == String($("select#site").val())}
        )[0];

        $(".order_form_selection>.site_dependent dd").each(function(i, elm){
          var not_null_flag = (function(template_shortcut){
            var result;
            try{
              $.each(Object.keys(site_info), function(i,v){
                if (RegExp(template_shortcut,'i').test(v)){
                  if (site_info[v] > 0) {
                    result = true;
                  } else {
                    result = false;
                  }
                  return false;
                }
              });
            } catch(er){
              result = true
            }
            return result;
          })($(elm).closest("div.start_order").attr('id'));

          if (not_null_flag) {
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
          } else {
            $(elm).text("-");
          }


        });

        $(".order_form_selection>.site_dependent .remain>dd").each(function(i, elm){
          var res = "";
          if ("-" == $(".budget>dd", $(elm).closest("div")).text()){
            $(elm).text("-");
          } else {
            res = parseFloat( $(".budget>dd", $(elm).closest("div")).text().substring(1) ) -
                parseFloat( $(".used>dd", $(elm).closest("div")).text().substring(1) );
            res = res.toFixed(2);
            if ("" !== res){
              $(elm).text("$" + res);
            }
          }
        });
      } else {
        $(".order_form_selection>.site_dependent dd").html("-");
      }
    });

    this.el.on('click', ".log_back", function(e){
      e.preventDefault();
      app.backButton();
    });

    this.el.on('click', "button.start_new_order", function(e){
      if ($("select#site").val() == "" && "paper" == $(e.currentTarget).closest("div.start_order").attr("id") ){

        navigator.notification.alert(
            "Please, select site to continue.", // message
            function(){},   // callback
            "New Order",    // title
            'Ok'            // buttonName
        );

      } else {
        if ("-" == $(".budget>dd", $(e.currentTarget).closest("div.start_order")).text()){
          navigator.notification.alert(
              "The order can't be placed: no budget available for the selected site.", // message
              function(){},   // callback
              $(".boxheader", $(e.currentTarget).closest("div.start_order")).text(),    // title
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
      }
    });

    this.el.on('click', "button#save_draft", function(e){

      navigator.notification.confirm(
          "Do you want to save this order as draft?",
          function(buttonIndex){
            if(2 == buttonIndex){
              if(String(self.order_id) == String(self.activeOrder.id) && !isObjectsEqual(self.activeOrder.proto, self.activeOrder.upd)){
                var drafts = app.mySupplyOrdersDrafts(),
                    mutation = app.ids_mutation();

                self.activeOrder.upd.updated_at_utc = (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');

                if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                    (function(){var _tmp = [];_tmp = $.grep(drafts, function(n,i){return n.supply_order_id == String(self.activeOrder.id)});return !(_tmp.length>0);})() ){
                  // новый черновик, не присутствующий в ЛС, добавляем его туда

                  drafts.unshift($.extend({
                    id: self.activeOrder.upd.supply_order_id,
                    supply_order_id: self.activeOrder.upd.supply_order_id,
                    supply_order_name: self.activeOrder.upd.supply_order_name,
                    updated_at: self.activeOrder.upd.updated_at,
                    updated_at_utc: self.activeOrder.upd.updated_at_utc,
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
                        updated_at_utc: self.activeOrder.upd.updated_at_utc,
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

    this.el.on('click', "button#proceed", function(e){
      e.preventDefault();
      setTimeout(function(){
        app.route({
          toPage: window.location.href + "#order-overall:active_order"
        });
      },0);
    });

    this.el.on('input propertychange', 'textarea#special_instructions', function(e){
      self.activeOrder.upd.special_instructions = $(e.currentTarget).val();
      app.activeOrder(self.activeOrder);
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

        if ( isNaN(parseInt($(".number span", $(e.currentTarget)).text())) ||
            0 == parseInt($(".number span", $(e.currentTarget)).text()) ){
          $(".clear", $popup).addClass("disabled");
        } else {
          $(".clear", $popup).removeClass("disabled");
        }
        $overlay.appendTo("body").trigger("create");
        $("input[type=hidden][id=item_id]", $popup).val($(e.currentTarget).attr("id"));
        $popup.css( "left",  Math.round( ($(window).width() - $popup.width())/2 ) );

        if ($popup.height() > ($(window).height() - 30)){
          $popup.css("top", $(document).scrollTop() + parseInt(25) + "px");
        } else {
          $popup.css("top", $(document).scrollTop() + Math.round(($(window).height() - $popup.height())/2) + "px");
        }
        $popup.css({"visibility": "visible", "z-index": 101});
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
          var details_arr = $(".details", $clicked_elm);

          self.activeOrder.upd.supply_order_categories[String(clicked_category)][String(elm_id)]['amount'] =
              $(event.currentTarget).attr("data-value");
          app.activeOrder(self.activeOrder);

          if ($(event.currentTarget).attr("data-value") > 0){
            $(".infodetails", $clicked_elm).removeClass("one");
            $(details_arr[2]).html("Total: <span>$" + (parseFloat($(event.currentTarget).attr("data-value")) *
                parseFloat(self.activeOrder['upd']['supply_order_categories'][clicked_category][elm_id]["price"])).toFixed(2) + "</span>");

            $("<div />", {
              class: "number"
            }).html("<font>Amount:</font><br /><span>"+ $(event.currentTarget).attr("data-value") +"</span>").appendTo($(".infodetails", $clicked_elm));
          } else {
            $(".infodetails", $clicked_elm).addClass("one");
            $(details_arr[2]).html("<span></span>");
            $(".infodetails>div.number", $clicked_elm).remove();
          }
          $clicked_elm.trigger("create");
        } catch(er){}
      }
      setTimeout(function(){
        self.recalculate_total().close_popup();
      }, 0);
    });

    $( window ).on( "resize", function(e) {
      try {
        setTimeout(function(){
          self.el.trigger("orderevent");
        },1);
      } catch(er){}
    });

    $( window ).on("scroll", function(e){
      try {
        if (!$.isEmptyObject(self.scroll_event_obj)){
          var $budget_elm = $("#"+self.scroll_event_obj.budget_elm);

          $budget_elm.css("visibility", "hidden");
          if (self.scroll_event_obj.budget_position_y > $(document).scrollTop() + self.scroll_event_obj.win_height) {
            $budget_elm.css("visibility", "visible");
          }
        }
      } catch(er){}
    });
  };

  this.initialize();
}

Handlebars.registerHelper("newOrderStartContent", function(order){
  var out = "";
  if ($.isEmptyObject(order)){
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
        budget_info = (function(){
          var ret = {};
          try {
            ret = {
              discretionary: {
                budget: parseFloat(my_sites[0]["budget_discretionary"]).toFixed(2),
                used: parseFloat(my_sites[0]["used_discretionary"]).toFixed(2),
                remain: (parseFloat(my_sites[0]["budget_discretionary"]) - parseFloat(my_sites[0]["used_discretionary"])).toFixed(2)
              },
              equipment: {
                budget: parseFloat(my_sites[0]["budget_equipment"]).toFixed(2),
                used: parseFloat(my_sites[0]["used_equipment"]).toFixed(2),
                remain: (parseFloat(my_sites[0]["budget_equipment"]) - parseFloat(my_sites[0]["used_equipment"])).toFixed(2)
              }
            }
          } catch (er) {
            ret = {
              discretionary: {
                budget: 0,
                used: 0,
                remain: 0
              },
              equipment: {
                budget: 0,
                used: 0,
                remain: 0
              }
            }
          }
          return ret;
        })();
    out = out + "<select name=\"client_site\" id=\"site\"><option value=\"\">- Select Site Location -</option>";
    $.each(my_sites, function( index, value ) {
      out = out + "<option value=\"" + value.site_id + "\">" + value.site + "</option>";
    });
    out = out + "</select>";
    out = out + "<div data-role=\"content\" class=\"order_form_selection\">";
    $.each(order_forms, function(i,v){
      current_order_type = v.match(/^(.+?)\b/)[1].toLowerCase();
      out = out + "<div id=\""+ current_order_type +"\" class=\"box start_order"+ (("paper" == current_order_type)?' site_dependent':'') +"\">" +
          "<div role=\"heading\" class=\"boxheader\">"+ v +"</div>" +
          "<div class=\"boxpoints\">" +
            "<div class=\"boxcnt\">" +
              "<dl class=\"budget\"><dt>Budget:</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['budget'])) +"</dd></dl>" +
              "<dl class=\"used\"><dt>Used:</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['used'])) +"</dd></dl>" +
              "<dl class=\"remain\"><dt>Remaining:</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['remain'])) +"</dd></dl>" +
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
        total = 0;

    out = out + "<div class=\"location_details\">";
    out = out + "<p><font>Order: "+ ((/^new_on_device/ig).test(order.supply_order_id)? '<em>-</em>': ('<strong>#' + order.supply_order_id + '</strong> from <strong>'+ (('' != order.order_date) ? order.order_date : '-') +'</strong>'));
    out = out + "<br />"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>";
    out = out + "<p class=\"add_info\">Order type: <span>"+order.order_form+"</span>";

    if ("log" == order.order_status){
      out = out + "<br />Submitted: <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>";
    }

    out = out + "</p>";
    out = out + "</div>";

    $.each(Object.keys(order.supply_order_categories), function(i,v){
      var category_out = "",
          empty_flag = true,
          category = order['supply_order_categories'][v];

      /* begin: reorganization and sorting */
      var sorted_items = [];
      for( var _key in category){
        if (category.hasOwnProperty(_key)) {
          sorted_items.push(category[_key]);
        }
      }
      sorted_items = sorted_items.sort(function (a, b) {
        return a.description.localeCompare( b.description );
      });
      /* end: sorting */


//      $.each(Object.keys(category), function(ik,vk){
      $.each(sorted_items, function(ik,item){
        var price = parseFloat(item.price),
            amount = parseFloat(item.amount),
            _total = price * amount;

        if ("log" != order.order_status || amount > 0){

          category_out = category_out + "<li>";
          if ("log" != order.order_status){
            category_out = category_out + "<a id=\"iid_"+item.item_id+"\" href=\"#editOrderItem:"+item.item_id+"\" class=\"btn-ordet\" data-role=\"button\">";
          }
          category_out = category_out + "<div class=\"infodetails"+ (amount > 0?'':' one') +"\">" +
            "<div>"+ item.description +"<br/>" +
              "<div class=\"details-all\">" +
                "<div class=\"details\">" + item.serial_number +"</div>" +
                "<div class=\"details mea\">"+ item.measurement +" <span>$"+ price.toFixed(2) + "</span></div>" +
                "<div class=\"details tot\">"+ ((amount > 0)?('Total: <span>$'+ _total.toFixed(2) + '</span>'):'<span></span>') +"</div>" +
              "</div>" +
            "</div>";

          if ("log" != order.order_status && amount > 0){
            category_out = category_out + "<div class=\"number\">" +
              "<font>Amount:</font><br /><span>" + amount + "</span>" +
            "</div>";
          }

          category_out = category_out + "</div>";
          if ("log" != order.order_status){
            category_out = category_out + "</a>";
          }

          category_out = category_out + "</li>";
          empty_flag = false;
          total = total + _total;

        }
      });
      if (!empty_flag)
        out = out + "<ul data-role=\"listview\" data-inset=\"true\"><li class=\"boxheader\" data-role=\"list-divider\" role=\"heading\">"+ v +"</li>" + category_out + "</ul>";
    });

    //over budget
    out = out + "<div class=\"over_budget\">" +
      "<div class=\"budget\">" +
        "Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span><br />Remaining: <span class=\"remain\">$"+ parseFloat(order.remaining_budget - total).toFixed(2) +"</span>" +
        "<div class=\"over\">"+ ((total>order.remaining_budget && "log" != order.order_status)?'Over Budget!!!':'') +"</div>" +
        "<div class=\"total\">" +
          "<p>Total: <span class=\"price\">$"+total.toFixed(2)+"</span></p>" +
        "</div>" +
      "</div>" +
    "</div>";

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
      out = out + "<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>" +
        "<td class=\"green_btn btnbox_1\"><button id=\"save_draft\">Save as Draft</button></td>"+
        "<td width=\"2%\">&nbsp;</td>"+
//        "<td class=\"green_btn\"><button id=\"submit_to_vendor\">Submit to Vendor</button></td>" +
        "<td class=\"green_btn\"><button id=\"proceed\">Proceed</button></td>" +
      "</tr></table>";
    }
  }
  return new Handlebars.SafeString(out);
});

OrderView.template = Handlebars.compile($("#order-tpl").html());