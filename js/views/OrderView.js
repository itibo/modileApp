var OrderView = function(order_id){
  this.order_id = order_id || "new";
  this.activeOrder = {};
  this.scroll_event_obj = false;
  this.order_type = "";
  this.comment_maxlength = 2000;

  this.render = function(){
    var context = {},
        prefix = "",
        self = this;

    context.order = {};
    context.comment_maxlength = self.comment_maxlength;

    switch (self.order_id) {
      case "new":
        context.title = "New Order";
        context.backTitle = "Cancel";
        context.order = $.extend(context.order, {type: "draft"});
        break;

      case "future":
        context.title = "New Future Order";
        context.backTitle = "Cancel";
        context.order = $.extend(context.order, {type: "future"});
        self.order_type = "future";
        break;

      default:
        var _old_order_id = self.order_id,
            drafts = app.mySupplyOrdersDrafts(),
            logs = app.myLastSubmittedOrders(),
            futures = app.myFutureOrders(),
            ids_in_ls = (function(){
              return $.merge(
                $.merge(
                    $.merge([], $.map(drafts, function(d){return d.supply_order_id;})),
                    $.map(logs, function(l){return l.supply_order_id;})
                ),
                $.map(futures, function(f){return f.supply_order_id;})
              );
            })(),
            mutations_obj = app.ids_mutation();
        self.activeOrder = app.activeOrder();

        if (!$.isEmptyObject(mutations_obj)){
          if ($.inArray(self.order_id, Object.keys(mutations_obj))>-1){
            self.order_id = mutations_obj[self.order_id];
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
//alert("впервые открываем любой ордер: " + ($.isEmptyObject(self.activeOrder) || undefined == self.activeOrder.id || $.inArray( self.activeOrder.id, [self.order_id, _old_order_id] ) < 0 ));
          if ($.isEmptyObject(self.activeOrder) || undefined == self.activeOrder.id
              || $.inArray( self.activeOrder.id, [self.order_id, _old_order_id] ) < 0 ){
            // впервые открываем любой ордер, как вновь созданный, так и уже существкющий

            var obj = {};
//alert("вновь созданный ордер: " + (RegExp('^new_on_device_','i').test(self.order_id) && ($.grep($.merge($.merge([], drafts), futures), function(n,i){ return $.inArray(n.supply_order_id, [_old_order_id, self.order_id ])>-1 })).length < 1));

            if (RegExp('^new_on_device_','i').test(self.order_id) &&
                ($.grep($.merge($.merge([], drafts), futures), function(n,i){
                  return $.inArray(n.supply_order_id, [_old_order_id, self.order_id ])>-1 })).length < 1)
            {
              // вновь созданный ордер, не сохраненный еще в ЛС

              var site_info = (function(id_arr){
                    var site_id = id_arr[2],
                        my_sites = app.mySites(),
                        tmp = {},
                        form = (RegExp('^f-','i').test(id_arr[1])) ? id_arr[1].substring(2) : id_arr[1];
                    prefix = (RegExp('^f-','i').test(id_arr[1])) ? "next_" : "";

                    $.each(my_sites, function(i,s){
                      if (site_id == s.site_id){
                        tmp = s;
                        return false;
                      }
                    });

                    if ($.isEmptyObject(tmp)){
                      return $.extend( {}, app.diamond_office,
                          (function(form_prefix){
                          var val = 0,
                              pend_val = 0,
                              site_to_get_budgets = $.grep(my_sites, function(n,i){
                                return n.assigned;
                              })[0];
                          if ("paper" != form_prefix && site_to_get_budgets) {
                            val = prefix.length > 0
                                ? parseFloat(site_to_get_budgets[prefix + "budget_"+form_prefix])
                                : (parseFloat(site_to_get_budgets["budget_"+form_prefix])
                                  - parseFloat(site_to_get_budgets["used_"+form_prefix]));
                            pend_val = parseFloat(site_to_get_budgets[prefix + "pending_"+form_prefix]);
                          }
                          return {
                            remaining_budget: val.toFixed(2),
                            pending_budget: pend_val.toFixed(2)
                          };
                        })(form)
                      );
                    } else {
                      return $.extend( {}, {
                        site_id: tmp.site_id,
                        site_name: tmp.site,
                        site_address: tmp.address
                      },
                      (function(form_prefix){
                        var budget = $.grep(Object.keys(tmp), function(n,i){
                          return RegExp('^' + prefix + 'budget_'+ form_prefix +'(\\b|_)','i').test(n);
                        })[0];

                        var pending = $.grep(Object.keys(tmp), function(n,i){
                          return RegExp('^' + prefix + 'pending_'+ form_prefix +'(\\b|_)','i').test(n);
                        })[0];

                        var used = $.grep(Object.keys(tmp), function(n,i){
                          return RegExp( '^' + (prefix.length > 0
                              ? (prefix + 'pending_')
                              : ('used_')) + form_prefix + '(\\b|_)' ,'i').test(n);
                        })[0];
                        var remain = parseFloat(tmp[budget] - (prefix.length > 0 ? 0 : tmp[used])) || 0;
                        return {
                          remaining_budget: remain.toFixed(2),
                          pending_budget: (parseFloat(tmp[pending]) || 0).toFixed(2)
                        };
                      })(form))
                    }
                  })(self.order_id.match(/^new_on_device_(.*)_(.*)_(.*)$/)),
                  form_and_items_info = (function(form){
                    var tmp = {},
                        return_obj = {},
                        form = (RegExp('^f-','i').test(form)) ? form.substring(2) : form;

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

              if (prefix.length > 0){
                self.order_type = "future";
              }

              obj = $.extend(obj, {
                supply_order_id: self.order_id,
                supply_order_name: "",
                updated_at: "",
                order_date: prefix.length > 0 ? self.subheader_supply_period("future", true) : "",
                special_instructions: ""
              }, site_info, form_and_items_info, {
                order_status: (prefix.length == 0) ? "new" : "new_future"
              });

            } else {
              // открывает драфт или фьюче ордер из ЛС

              var _transform_id = function(new_id){
                this.id = self.new_id;
                this.supply_order_id = new_id;
                return this;
              };

              $.each(drafts, function(i,v){
                if (String(self.order_id) == String(v.supply_order_id) &&
                    (undefined == typeof (v.submit_status) || "submitting" != v.submit_status)){
                  obj = $.extend(((undefined != v.locally_saved ) ? v.locally_saved : v), {order_status: "draft"});
                  return false;
                } else if ($.inArray(v.supply_order_id, Object.keys(mutations_obj)) > -1 ){
                  obj = $.extend(true,
                      _transform_id.call(((undefined != v.locally_saved ) ? v.locally_saved : v ), mutations_obj[v.supply_order_id]),
                      {order_status: "draft"}
                  );
                  return false;
                }
              });
//alert("после поиска в драфтах: " + JSON.stringify(obj));

              if ($.isEmptyObject(obj)){
                $.each(futures, function(i,v){
                  if (String(self.order_id) == String(v.supply_order_id)){
                    obj = $.extend(((undefined != v.locally_saved ) ? v.locally_saved : v), {order_status: "future"});
                    self.order_type = "future";
                    return false;
                  } else if ($.inArray(v.supply_order_id, Object.keys(mutations_obj)) > -1 ){
                    obj = $.extend(true,
                        _transform_id.call(((undefined != v.locally_saved ) ? v.locally_saved : v ), mutations_obj[v.supply_order_id]),
                        {order_status: "future"}
                    );
                    self.order_type = "future";
                    return false;
                  }
                });
//alert("после поиска в фьючерах: " + JSON.stringify(obj));
              }
            }

            if ($.isEmptyObject(obj)){
//alert("не найдено! order_id: " + self.order_id + "; драфты: " + JSON.stringify(drafts));
//alert("не найдено! order_id: " + self.order_id + "; фьючеры: " + JSON.stringify(futures));
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
              if ($.inArray(obj.order_status, ["future", "new_future"]) > -1){
                self.order_type = "future";
              }
              self.activeOrder = app.activeOrder($.extend({
                id: self.order_id,
                supply_order_id: self.order_id,
                status: obj.order_status
              }, {
                proto: ($.inArray(obj.order_status, ["new", "new_future"]) > -1) ? {} : $.extend(true, {}, obj),
                upd: $.extend(true, {}, obj)
              }));
            }
          } else {
            // входим после некорректного выхода из редактирования

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

              if ($.inArray(self.activeOrder.upd, ["future", "new_future"]) > -1){
                self.order_type = "future";
              }

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

        context.title = ("future" === self.order_type)? "Future Order Details" : "Order Details";
        break;
    }
    context.subheader = (function(){
      var userInfo = app.getUserInfo();
      return "<h5><font>" + userInfo.display_name +"</font>, " + userInfo.role + "<br />" +
          "Supply Period: <font>" +
          self.subheader_supply_period(self.order_type) +
          "</font></h5>";
    })();

    this.el.html(OrderView.template(context));
    return this;
  };

  this.subheader_supply_period = function(order_type, short_mode){
    var short_mode = short_mode || false,
        order_type = order_type || "draft",
        monthNames = short_mode
        ? ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sept", "Oct", "Nov", "Dec"]
        : [ "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December" ];
    var formattedDate = new Date();
    if ("future" === order_type){
      return $.inArray(monthNames[formattedDate.getMonth()], ["December", "Dec"]) > -1 ?
          (short_mode
              ? (monthNames[0] + " 1, " + (formattedDate.getFullYear() + 1))
              : (monthNames[0] + " " + (formattedDate.getFullYear() + 1))) :
          (short_mode
              ? (monthNames[formattedDate.getMonth()+1] + " 1, " + formattedDate.getFullYear())
              : (monthNames[formattedDate.getMonth()+1] + " " + formattedDate.getFullYear()));
    } else {
      return monthNames[formattedDate.getMonth()] + " " + formattedDate.getFullYear();
    }
  };

  this.close_popup = function(){
    $(".popup-overlay").remove();
    $(".pop_up > input[type=hidden]").val("");

    $(".pop_up .popup_content>div").hide();
    $(".pop_up input[name=item_amount]").val("");
    $(".pop_up .popup_content>div:first-child").show();

    $(".pop_up").css("visibility", "hidden");
    return this;
  };

  this.save_and_rebuild_view_by_value = function(new_value){

    var self = this;
    var $clicked_elm = $("a[id='"+$(".pop_up>input[type=hidden][id=item_id]").val()+"']");
    try {
      var clicked_category = $("li[data-role=list-divider]", $clicked_elm.closest("ul")).text();
      var elm_id = $clicked_elm.attr("id").match(/^iid_(\d+)_(.*)$/i)[1];
      var details_arr = $(".details", $clicked_elm);

      self.activeOrder.upd.supply_order_categories[String(clicked_category)][String(elm_id)]['amount'] = new_value > 0 ? new_value : 0;
      app.activeOrder(self.activeOrder);

      if (new_value > 0){
        $(".infodetails", $clicked_elm).removeClass("one");
        $(details_arr[2]).html("Total: <span>$" + (parseFloat(new_value) *
            parseFloat(self.activeOrder['upd']['supply_order_categories'][clicked_category][elm_id]["price"])).toFixed(2) + "</span>");

        $(".infodetails > .number", $clicked_elm).remove();
        $("<div />", {
          class: "number"
        }).html("<font>Amount:</font><br /><span>"+ new_value +"</span>").appendTo($(".infodetails", $clicked_elm));
      } else {
        $(".infodetails", $clicked_elm).addClass("one");
        $(details_arr[2]).html("<span></span>");
        $(".infodetails > .number", $clicked_elm).remove();
      }
      $clicked_elm.trigger("create");
    } catch(er){}
    return self;
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

    $(".over_budget>.budget span.remain").html("$"+ parseFloat(self.activeOrder.upd.remaining_budget
        - ($.inArray(self.activeOrder.status, ["future","new_future"]) > -1 || $.inArray(self.activeOrder.upd.order_status, ["future","new_future"]) > -1
            ? self.activeOrder.upd.pending_budget
            : 0 ) - total).toFixed(2));

    if (parseFloat(self.activeOrder.upd.remaining_budget
      - ($.inArray(self.activeOrder.status, ["future","new_future"]) > -1 || $.inArray(self.activeOrder.upd.order_status, ["future","new_future"]) > -1
            ? self.activeOrder.upd.pending_budget
            : 0 ) - total) >= 0 ){
      $(".over_budget .over").html("");
    } else {
      $(".over_budget .over").html("Over Budget!!!");
    }
    $("div.over_budget span.price").text("$" + total.toFixed(2));
    return self;
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

        var budget_elm = $("div.over_budget").clone().attr("id", "budget_clone").css({
          "bottom": 0,
          "margin-bottom": 0,
          "margin-left": 0,
          "position": "fixed",
          "width": Math.floor(budget_position_width) + "px",
          "visibility": "hidden",
          "z-index": 100
        }).appendTo(".categories").trigger('create');

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
          })($(elm).closest(".start_order").attr('id'));

          if (not_null_flag) {
            var obj_key_prefix = ("future" === self.order_id
                ? ("next_" + ("used" == $(elm).parent().attr('class') ? "pending" : $(elm).parent().attr('class') ) )
                : $(elm).parent().attr('class')
                ) + "_" + $(elm).closest("div.start_order").attr('id');

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
        $(".order_form_selection > .site_dependent dd").html("-");
      }
    });

    this.el.on('click', ".log_back a", function(e){
      e.preventDefault();
      e.stopPropagation();
      app.backButton();
    });

    this.el.on('click', ".start_new_order", function(e){
      e.preventDefault();
      var $order_form_selection = $(e.currentTarget).parents(".order_form_selection")[0];

      if (!$order_form_selection.clicked) {
        $order_form_selection.clicked = true;
        var future_order = $(e.currentTarget).hasClass("future");
        if ($("select#site").val() == "" && "paper" == $(e.currentTarget).closest("div.start_order").attr("id") ){

          navigator.notification.alert(
              "Please, select site to continue.", // message
              function(){
                $order_form_selection.clicked = false;
              },   // callback
              (future_order ? "New Future Order" : "New Order"),    // title
              'Ok'            // buttonName
          );

        } else {

          if (future_order && parseFloat($(".remain > dd", $(e.currentTarget).closest(".start_order")).text().substring(1)) < 0 ){
            navigator.notification.alert(
                "There are no more budget available for this type of order.", // message
                function(){
                  $order_form_selection.clicked = false;
                },   // callback
                (future_order ? "New Future Order" : "New Order"),    // title
                'Ok'            // buttonName
            );
          } else if ("-" == $(".budget > dd", $(e.currentTarget).closest(".start_order")).text()){
            navigator.notification.alert(
                "The order can't be placed: no budget available for the selected site.", // message
                function(){
                  $order_form_selection.clicked = false;
                },   // callback
                $(".boxheader", $(e.currentTarget).closest(".start_order")).text(),    // title
                'Ok'            // buttonName
            );
          } else {
            setTimeout(function(){
              app.route({
                toPage: window.location.href + "#order:new_on_device_" +
                    (future_order ? "f-": "") + $(e.currentTarget).closest(".start_order").attr("id") +
                    "_" + ((""!=$("#site").val())? $("#site").val() : '0000') + "_" + (new Date()).getTime()
              });
              $order_form_selection.clicked = false;
            },0);
          }
        }
      }
    });

    this.el.on('click', "#save_draft", function(e){
      e.preventDefault();
      var $manage_area = $(e.currentTarget).parents(".manage_area")[0];
      if (!$manage_area.clicked) {
        $manage_area.clicked = true;

        if (self.activeOrder.upd.special_instructions
            && self.activeOrder.upd.special_instructions.length > self.comment_maxlength){
          navigator.notification.alert(
              "Comment is too large. Please correct it.",         // message
              function(){                       //callback
                $manage_area.clicked = false;
              },
              "Draft saving",          // title
              'Ok'                              // buttonName
          );
        } else {
          navigator.notification.confirm(
              "Do you want to save this order as draft?",
              function(buttonIndex){
                if(2 == buttonIndex){

                  if(String(self.order_id) == String(self.activeOrder.id) && !isObjectsEqual(self.activeOrder.proto, self.activeOrder.upd)){
                    var drafts = app.mySupplyOrdersDrafts(),
                        mutation = app.ids_mutation();

                    self.activeOrder.upd.updated_at_utc = (new Date(app.last_sync_date()) > new Date())
                        ? new Date(app.last_sync_date()).toJSON().replace(/\.\d{3}Z$/,'Z')
                        : (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');

                    if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                        (function(){
                          var _tmp = [];
                          _tmp = $.grep(drafts, function(n,i){
                            return $.inArray(n.supply_order_id,
                                [ String(self.activeOrder.upd.supply_order_id),
                                  (undefined == mutation[self.activeOrder.upd.supply_order_id])
                                      ? null
                                      : String(mutation[self.activeOrder.upd.supply_order_id])
                                ]
                            ) > -1
                          });
                          return _tmp.length<1;
                        })() ){
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
                    app.sync();
                  }

                  setTimeout(function(){
                    var filter_site_id;
                    try{
                      filter_site_id = app.siteFilter();
                      filter_site_id = (filter_site_id === ("" === String(self.activeOrder.upd.site_id) ? "diamond_office" : String(self.activeOrder.upd.site_id)) ) ? filter_site_id : "";
                    } catch (er){
                      filter_site_id = "";
                    }
                    app.siteFilter( filter_site_id ) ;
                    self.activeOrder = {};
                    app.activeOrder(false);
                    app.activeTab("drafts");
                    app.route({
                      toPage: window.location.href + "#orders"
                    });
                  },0);
                }
                $manage_area.clicked = false;
              },
              "Supply Order",
              ['Cancel','Save']
          );
        }
      }
    });

    this.el.on('click', "#proceed", function(e){
      e.preventDefault();
      var $manage_area = $(e.currentTarget).parents(".manage_area")[0];
      if (!$manage_area.clicked) {
        $manage_area.clicked = true;

        if (self.activeOrder.upd.special_instructions
            && self.activeOrder.upd.special_instructions.length > self.comment_maxlength){
          navigator.notification.alert(
              "Comment is too large. Please correct it.",         // message
              function(){                       //callback
                $manage_area.clicked = false;
              },
              "Order processing",          // title
              'Ok'                              // buttonName
          );
        } else {
          setTimeout(function(){
            app.route({
              toPage: window.location.href + "#order-overall:active_order"
            });
            $manage_area.clicked = false;
          },0);
        }
      }
    });

    this.el.on('input propertychange', '#special_instructions', function(e){
      e.preventDefault();

      $(".characterscountdown>strong", $(e.delegateTarget)).html($(e.currentTarget).val().length);
      if ($(e.currentTarget).val().length > self.comment_maxlength){
        $(".characterscountdown>strong", $(e.delegateTarget)).addClass("error");
      } else {
        $(".characterscountdown>strong", $(e.delegateTarget)).removeClass("error");
      }

      self.activeOrder.upd.special_instructions = $(e.currentTarget).val();
      app.activeOrder(self.activeOrder);
    });

    this.el.on('click', 'ul[data-role=listview] li a', function(e){
      e.preventDefault();
      e.stopPropagation();

      var $popup = $(".pop_up"),
          $score_elm = $(".number span", $(e.currentTarget)).eq(0);

      var $overlay = $("<div />", {
          class: "popup-overlay"
        }).on("click", function(ev){
          ev.preventDefault();
          self.close_popup();
      });

      try {

        if ( isNaN(parseInt($score_elm.text())) || 0 == parseInt($score_elm.text()) ){
          $(".clear", $popup).addClass("disabled");
        } else {
          $(".clear", $popup).removeClass("disabled");
        }
        $overlay.appendTo("body").trigger("create");
        $("input[type=hidden][id=item_id]", $popup).val($(e.currentTarget).attr("id"));
        $popup.css( "left",  Math.round( ($(window).width() - $popup.width())/2 ) );

        if ( !isNaN(parseInt($score_elm.text())) && parseInt($score_elm.text()) > 10 ){
          $(".popup_content > div", $popup).eq(0).hide();
          $("#more", $popup).show();
        } else {
          $(".popup_content > div", $popup).eq(0).show();
          $("#more", $popup).hide();
        }

        if ($popup.height() > ($(window).height() - 30)){
          $popup.css("top", $(document).scrollTop() + parseInt(25) + "px");
        } else {
          $popup.css("top", $(document).scrollTop() + Math.round(($(window).height() - $popup.height())/2) + "px");
        }

        $popup.css({"visibility": "visible", "z-index": 101});
        if (!isNaN(parseInt($score_elm.text()) && "none" !== $("#more", $popup).css('display'))){
          $("input[name=item_amount]", $popup).val(parseInt($score_elm.text())).focus();
        }

      } catch (er){}
    });

    this.el.on('click', '.pop_up .close', function(e){
      e.preventDefault();
      e.stopPropagation();
      self.close_popup();
    });

    this.el.on('click', '.pop_up .popup_content a, .pop_up a.clear', function(event){
      event.preventDefault();
      event.stopPropagation();

      var $elm = $(event.currentTarget);
      if ($elm.hasClass("more")){
        $elm.closest("div").hide();
        $(".popup_content > #more").show();
        $("#more").find("input[name=item_amount]").focus();
      } else {
        if (!$elm.hasClass('disabled')){
          self.save_and_rebuild_view_by_value($elm.attr("data-value")).recalculate_total().close_popup();
        }
      }
    });

    this.el.on('click', '#more #save_btn', function(event){
      event.preventDefault();
      var new_val = parseInt($("input[name=item_amount]").val()) || 0;
      self.save_and_rebuild_view_by_value(new_val).recalculate_total().close_popup();
    });

    this.el.on('keydown', '#more #item_amount', function(event){
      switch (true) {
        case event.which === 9:
        case event.keyCode === 13:
          var new_val = parseInt($("input[name=item_amount]").val()) || 0;
          self.save_and_rebuild_view_by_value(new_val).recalculate_total().close_popup();
        break;
        default:
          if ($(event.currentTarget).val().length > 2){
            $(event.currentTarget).val($(event.currentTarget).val().slice(0,2));
          }
          break;
      }
    });

    $( window ).on("resize", function(e) {
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
  var out = [];
  if (undefined !== order.type){
    out.push("<div data-role=\"content\" class=\"select_location\">");
    var my_sites = app.mySites(),
        current_order_type,
        prefix = "future" === order.type ? "next_" : "",
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
          var ret = {},
              site_to_get_budgets = $.grep(my_sites, function(n,i){
                return n.assigned;
              })[0];
          try {
            var d_budget = parseFloat(site_to_get_budgets[prefix + "budget_discretionary"]).toFixed(2),
                d_pending = parseFloat( undefined !== site_to_get_budgets[prefix + "pending_discretionary"]
                    ? (site_to_get_budgets[prefix + "pending_discretionary"]) : 0).toFixed(2),
                d_used = parseFloat( prefix.length > 0 ? (site_to_get_budgets[prefix + "pending_discretionary"])
                    : ( site_to_get_budgets["used_discretionary"] ) ).toFixed(2),
                d_remain = ( d_budget - d_used ).toFixed(2),
                u_budget = parseFloat(site_to_get_budgets[prefix + "budget_equipment"]).toFixed(2),
                u_pending = parseFloat( undefined !== site_to_get_budgets[prefix + "pending_equipment"]
                    ? (site_to_get_budgets[prefix + "pending_equipment"]) : 0 ).toFixed(2),
                u_used = parseFloat( prefix.length > 0 ? (site_to_get_budgets[prefix + "pending_equipment"] )
                    : ( site_to_get_budgets["used_equipment"] ) ).toFixed(2),
                u_remain = ( u_budget - u_used ).toFixed(2);
            ret = {
              discretionary: {
                budget: d_budget,
                pending: d_pending,
                used: d_used,
                remain: d_remain
              },
              equipment: {
                budget: u_budget,
                pending: u_pending,
                used: u_used,
                remain: u_remain
              }
            }
          } catch (er) {
            ret = {
              discretionary: {
                budget: 0,
                pending: 0,
                used: 0,
                remain: 0
              },
              equipment: {
                budget: 0,
                pending: 0,
                used: 0,
                remain: 0
              }
            }
          }
          return ret;
        })();

    my_sites = (function(all_sites){
      all_sites = $.grep(all_sites, function(n,i){
        return n.assigned;
      });
      var sites = [],
          date_allowed_to_create_future;
      if ("future" === order.type) {
        date_allowed_to_create_future = (function(){
          var date = new Date();
          return new Date(date.getFullYear(), date.getMonth() + 1, -6);
        })();
        try {
          $.each(all_sites, function(ind, site){
            if ( (new Date(site.last_inspection_date)) > date_allowed_to_create_future  )
              sites.push(site);
          });
        } catch (er){}

      } else {
        sites = all_sites;
      }
      return sites;
    })(my_sites);

    out.push("<select name=\"client_site\" id=\"site\"><option value=\"\">- Select Site Location -</option>");
    $.each(my_sites, function( index, value ) {
      out.push("<option value=\"" + value.site_id + "\">" + value.site + "</option>");
    });
    out.push("</select>");
    out.push("<div data-role=\"content\" class=\"order_form_selection\">");
    $.each(order_forms, function(i,v){
      current_order_type = v.match(/^(.+?)\b/)[1].toLowerCase();
      out.push("<div id=\""+ current_order_type +"\" class=\"box start_order"+ (("paper" == current_order_type)?' site_dependent':'') +"\">" +
          "<div role=\"heading\" class=\"boxheader\">"+ v +"</div>" +
          "<div class=\"boxpoints\">" +
            "<div class=\"boxcnt\">" +
              "<dl class=\"budget\"><dt>Budget:</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['budget'])) +"</dd></dl>" +
              "<dl class=\"used\"><dt>"+ (prefix.length > 0 ? "Pending:": "Used:") +"</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['used'])) +"</dd></dl>" +
              "<dl class=\"remain\"><dt>Remaining:</dt><dd>"+ (("paper" == current_order_type || budget_info[current_order_type]['budget'] <= 0)?'-':('$'+budget_info[current_order_type]['remain'])) +"</dd></dl>" +
            "</div>" +
            "<div class=\"box_rightcnt\">" +
              "<button class=\"start_new_order"+ (prefix.length > 0 ? ' future' : '') +"\">Start</button>" +
            "</div>" +
          "</div>" +
        "</div>");
    });
    out.push("</div></div>");
  }

  return new Handlebars.SafeString(out.join(""));
});

Handlebars.registerHelper("orderContent", function(order_obj){
  var out = [],
      comment_maxlength = this.comment_maxlength;


  if (undefined !== order_obj.id && undefined === order_obj.type){
    var order = order_obj.upd,
        total = 0;

    out.push("<div class=\"location_details\">");
    out.push("<p><font>Order: "+ ((/^new_on_device/ig).test(order.supply_order_id)? '<em>-</em>': ('<strong>#' + order.supply_order_id + '</strong> from <strong>'+ (('' != order.order_date) ? order.order_date : '-') +'</strong>')));
    out.push("<br />"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>");
    out.push("<p class=\"add_info\">Order type: <span>"+order.order_form+"</span>");

    if ("log" == order.order_status){
      out.push("<br />Submitted: <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>");
    }

    out.push("</p></div>");

    try {
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

        $.each(sorted_items, function(ik,item){
          var price = parseFloat(item.price),
              amount = parseFloat(item.amount),
              _total = price * amount;

          if ("log" != order.order_status || amount > 0){

            category_out = category_out + "<li>";
            if ("log" != order.order_status){
              category_out = category_out + "<a id=\"iid_"+item.item_id+"_"+ i +"\" class=\"btn-ordet\" data-role=\"button\">";
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
          out.push("<ul data-role=\"listview\" data-inset=\"true\">" + "<li class=\"boxheader\" data-role=\"list-divider\" role=\"heading\">"+ v +"</li>" + category_out + "</ul>");
      });
      //over budget
      out.push("<div class=\"over_budget\">" +
        "<div class=\"budget\">");

      if ($.inArray(order_obj.status, ["future","new_future"]) > -1 || $.inArray(order.order_status, ["future","new_future"]) > -1){
        out.push("Month budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span>"+
            "<br />Pending (in other orders): <span class=\"pending\">$"+ parseFloat(order.pending_budget).toFixed(2) +"</span>"+
            "<br />Remaining: <span class=\"remain\">$"+ parseFloat(order.remaining_budget - order.pending_budget - total).toFixed(2) +"</span>" +
            "<div class=\"over\">"+ ( ( parseFloat(order.remaining_budget - order.pending_budget - total) < 0 && "log" != order.order_status ) ? 'Over Budget!!!' : '' ) +"</div>");
      } else {
        out.push("Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span>"+
            "<br />Remaining: <span class=\"remain\">$"+ parseFloat(order.remaining_budget - total).toFixed(2) +"</span>" +
            "<div class=\"over\">"+ ((parseFloat(order.remaining_budget - total) < 0 && "log" != order.order_status)?'Over Budget!!!':'') +"</div>");
      }
      out.push("<div class=\"total\">" +
            "<p>Total: <span class=\"price\">$"+total.toFixed(2)+"</span></p>" +
          "</div>" +
        "</div>" +
      "</div>");

      // Special Instructions

      if ("log" != order.order_status){
        out.push("<h3>Special Instructions:</h3><div class=\"block-textarea\">");
        out.push("<div class=\"characterscountdown\"><strong"+(order.special_instructions.length>comment_maxlength ? " class=\"error\"" : "")+">"+ order.special_instructions.length +"</strong> of "+ comment_maxlength +"</div>");
        out.push("<textarea id=\"special_instructions\" name=\"special_instructions\">" + order.special_instructions + "</textarea>");
      } else if ($.trim(order.special_instructions).length > 0) {
        out.push("<div class=\"location_details\">");
        out.push("<p><font>Special Instructions:</font></p>");
        out.push("<p>" + $.trim(order.special_instructions).replace(/\n/gi, "<br />") + "</p>");
        out.push("</div>");
      }

      out.push("</div>");

      if ("log" != order.order_status){
        out.push("<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>");
        if ($.inArray(order.order_status, ["future", "new_future"])<0){
          out.push("<td class=\"green_btn btnbox_1\"><button id=\"save_draft\">Save as Draft</button></td>"+
              "<td width=\"2%\">&nbsp;</td>" +
              "<td class=\"green_btn\"><button id=\"proceed\">Proceed</button></td>");
        } else {
          out.push("<td width=\"24%\">&nbsp</td>"+
              "<td class=\"green_btn\"><button id=\"proceed\">Proceed</button></td>" +
              "<td width=\"24%\">&nbsp;</td>");
        }
        out.push("</tr></table>");
      }
    } catch(er){}
  }
  return new Handlebars.SafeString(out.join(""));
});

OrderView.template = Handlebars.compile($("#order-tpl").html());