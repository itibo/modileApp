var OrderOverallView = function(order_id){
  this.order_id = order_id || "active_order";
  this.activeOrder = {};

  this.render = function(){
    var context = {},
        self=this;

    context.userInfo = app.getUserInfo();

    context.order = (function(){
      var ret_obj = {},
          mutations_obj = app.ids_mutation(),
          error_alert = function(){
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
          };

      try{
        self.activeOrder = app.activeOrder();
        if ("active_order" != self.order_id ){
          var _old_order_id = self.order_id,
              logs = app.myLastSubmittedOrders(),
              obj = {};

          if (!$.isEmptyObject(mutations_obj)){
            if ($.inArray(self.order_id, Object.keys(mutations_obj))>-1){
              self.order_id = mutations_obj[self.order_id];
              mutations_obj[_old_order_id] = void 0;
              delete mutations_obj[_old_order_id];
            }
          }

          $.each(logs, function(i,v){
            if (String(self.order_id) == String(v.supply_order_id)){
              obj = $.extend(((undefined != v.locally_saved ) ? v.locally_saved : v), {order_status: "log"});
              return false;
            }
          });

          if ($.isEmptyObject(obj)){
            error_alert();
          } else {
            ret_obj = $.extend({
              id: self.order_id,
              status: obj.order_status
            }, {
              proto: $.extend(true, {}, obj),
              upd: $.extend(true, {}, obj)
            });
          }
        } else if("active_order" == self.order_id && !$.isEmptyObject(self.activeOrder)){
          ret_obj = self.activeOrder;
        } else {
          error_alert();
        }
      } catch(er){
        error_alert();
      }

      return ret_obj;
    })();


    context.backUrl = "<a href=\""+ (("active_order" == self.order_id && !$.isEmptyObject(self.activeOrder))?
        ('#order:' + self.activeOrder.upd.supply_order_id) : '#orders') +"\" class=\"ui-btn-right\" data-role=\"button\">Back</a>";

    this.el.html(OrderOverallView.template(context));
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

    this.el.on('click', ".log_back", function(e){
      e.preventDefault();
      app.backButton();
    });

    this.el.on("change", "input[name=priority]:radio", function(e){
      e.preventDefault();


      $("div.priority-box>div").removeClass("active");
      $(e.currentTarget).closest("div").parent().addClass("active");

      self.activeOrder.upd.priority = $(e.currentTarget).val();
    });

    this.el.on('click', "button#submit_to_vendor", function(e){
      var active_order_info = (function(){
        var _total = 0,
            _count = 0;

        $.each(Object.keys(self.activeOrder.upd.supply_order_categories), function(i,v){
          var _category = self.activeOrder.upd.supply_order_categories[v];
          $.each(Object.keys(_category), function(ik,vk){
            var _am = parseFloat(_category[vk]["amount"]);
            if ( _am > 0 ) {
              _count = _count + _am;
              _total = _total + ( _am * parseFloat(_category[vk]["price"]) );
            }
          });
        });

        return {
          total: _total,
          count: _count
        }
      })();

      if ( active_order_info.count > 0) {

        if (active_order_info.total > parseFloat(self.activeOrder.upd.remaining_budget)){
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
                      submitted_item = {},
                      mutation = app.ids_mutation();

                  self.activeOrder.upd.updated_at_utc = (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');

                  // новый черновик, не присутствующий в ЛС, добавляем его туда
                  if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                      (function(){
                        var _tmp = [];
                        _tmp = $.grep(mySupplyOrdersDrafts, function(n,i){
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

                    mySupplyOrdersDrafts.unshift($.extend({
                      id: self.activeOrder.upd.supply_order_id,
                      supply_order_id: self.activeOrder.upd.supply_order_id,
                      supply_order_name: self.activeOrder.upd.supply_order_name,
                      updated_at: self.activeOrder.upd.updated_at,
                      updated_at_utc: self.activeOrder.upd.updated_at_utc,
                      order_date: self.activeOrder.upd.order_date,
                      order_form: self.activeOrder.upd.order_form,
                      priority: self.activeOrder.upd.priority,
                      site_id: self.activeOrder.upd.site_id,
                      site_name: self.activeOrder.upd.site_name,
                      site_address: self.activeOrder.upd.site_address,
                      special_instructions: self.activeOrder.upd.special_instructions,
                      remaining_budget: self.activeOrder.upd.remaining_budget
                    }, {
                      order_status:"log"
                    }));
                  }

                  app.mySupplyOrdersDrafts((function(){
                    $.each(mySupplyOrdersDrafts, function(i,v){
//                      if(String(self.activeOrder.upd.supply_order_id) == String(v.supply_order_id)){
                      if ($.inArray( String(v.supply_order_id),
                          [ String(self.activeOrder.upd.supply_order_id),
                            (undefined === mutation[self.activeOrder.upd.supply_order_id])? null : String(mutation[self.activeOrder.upd.supply_order_id])]
                          ) > -1 )
                      {
                        var order_form_short = v.order_form.match(/^(.+?)\b/)[0].toLowerCase();

                        if (undefined !== mutation[self.activeOrder.upd.supply_order_id]){
                          self.activeOrder.upd.supply_order_id = mutation[self.activeOrder.upd.supply_order_id];
                          self.activeOrder.upd.id = mutation[self.activeOrder.upd.supply_order_id];
                        }

                        mySupplyOrdersDrafts[i] = $.extend( true, {
                          id: self.activeOrder.upd.supply_order_id,
                          supply_order_id: self.activeOrder.upd.supply_order_id,
                          supply_order_name: self.activeOrder.upd.supply_order_name,
                          updated_at: self.activeOrder.upd.updated_at,
                          updated_at_utc: self.activeOrder.upd.updated_at_utc,
                          order_date: self.activeOrder.upd.order_date,
                          order_form: self.activeOrder.upd.order_form,
                          priority: self.activeOrder.upd.priority,
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
                      if (self.activeOrder.upd.order_form == v.order_form &&
                          ( (self.activeOrder.upd.site_id == v.site_id && "paper" == order_form_short) || "paper" != order_form_short ) ){
                        mySupplyOrdersDrafts[i]['remaining_budget'] = (parseFloat(v.remaining_budget) - active_order_info.total).toFixed(2);
                      }
                    });
                    return mySupplyOrdersDrafts;
                  })());

                  app.myLastSubmittedOrders((function(submitted_item){
                    submitted_item = submitted_item.locally_saved;
                    if (!$.isEmptyObject(submitted_item)){
                      myLastSubmittedOrders.unshift(submitted_item);
                    }
                    return myLastSubmittedOrders;
                  })(submitted_item));

                  // локальный перерасчет бюджетов
                  app.mySites((function(){
                    var mySites = app.mySites(),
                        short_order_form = self.activeOrder.upd.order_form.match(/^(.+?)\b/)[0].toLowerCase();
                    $.each(mySites, function(i,v){
                      try{
                        if (v.assigned){
                          if ("" === String(self.activeOrder.upd.site_id) || "paper" !== short_order_form )
                          {
                            mySites[i]["used_"+short_order_form] = parseFloat(mySites[i]["used_"+short_order_form])
                                + parseFloat(active_order_info.total);
                          } else {
                            if (v.site_id == self.activeOrder.upd.site_id){
                              for(var objkey in mySites[i]){
                                if ((new RegExp("^used_"+short_order_form)).test(objkey)){
                                  mySites[i][objkey] = parseFloat(mySites[i][objkey])
                                      + parseFloat(active_order_info.total);
                                }
                              }
                              return false;
                            }
                          }
                        }
                      } catch(er){}
                    });
                    return mySites;
                  })());

                  app.sync();
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
                    app.activeTab("submitted");
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

    this.el.on('click', "button#save_draft", function(e){

      navigator.notification.confirm(
          "Do you want to save this order as draft?",
          function(buttonIndex){
            if(2 == buttonIndex){
              if(!isObjectsEqual(self.activeOrder.proto, self.activeOrder.upd)){
                var drafts = app.mySupplyOrdersDrafts(),
                    mutation = app.ids_mutation();

                self.activeOrder.upd.updated_at_utc = (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');

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
                    priority: self.activeOrder.upd.priority,
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
                    if ($.inArray(String(dr.supply_order_id),
                        [String(self.activeOrder.upd.supply_order_id),
                          (undefined == mutation[self.activeOrder.upd.supply_order_id])? null :
                              String(mutation[self.activeOrder.upd.supply_order_id])] ) > -1 )
                    {
                      var draft_to_update = {};

                      if (undefined != mutation[self.activeOrder.upd.supply_order_id]){
                        self.activeOrder.upd.supply_order_id = mutation[self.activeOrder.upd.supply_order_id];
                        self.activeOrder.upd.id = mutation[self.activeOrder.upd.supply_order_id];
                      }

                      draft_to_update = $.extend({
                        id: self.activeOrder.upd.supply_order_id,
                        supply_order_id: self.activeOrder.upd.supply_order_id,
                        supply_order_name: self.activeOrder.upd.supply_order_name,
                        updated_at: self.activeOrder.upd.updated_at,
                        updated_at_utc: self.activeOrder.upd.updated_at_utc,
                        order_date: self.activeOrder.upd.order_date,
                        order_form: self.activeOrder.upd.order_form,
                        priority: self.activeOrder.upd.priority,
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
          },
          "Supply Order",
          'Cancel,Save'
      );

    });

    this.el.on('click', "button#save_future", function(e){

      navigator.notification.confirm(
          "Do you want to save this future order?",
          function(buttonIndex){
            if(2 == buttonIndex){
              if(!isObjectsEqual(self.activeOrder.proto, self.activeOrder.upd)){
                var future_orders = app.myFutureOrders(),
                    mutation = app.ids_mutation();

                self.activeOrder.upd.updated_at_utc = (new Date()).toJSON().replace(/\.\d{3}Z$/,'Z');


//alert("новый фьючер: " + ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) && (function(){ var _tmp = []; _tmp = $.grep(future_orders, function(n,i){ return $.inArray(n.supply_order_id, [ String(self.activeOrder.upd.supply_order_id), (undefined == mutation[self.activeOrder.upd.supply_order_id]) ? null : String(mutation[self.activeOrder.upd.supply_order_id]) ] ) > -1 }); return _tmp.length<1; })() ));


                if ( RegExp('^new_on_device_','i').test(self.activeOrder.upd.supply_order_id) &&
                    (function(){
                      var _tmp = [];
                      _tmp = $.grep(future_orders, function(n,i){
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
                  // новый фьючер, не присутствующий в ЛС, добавляем его туда

                  future_orders.unshift($.extend(true, {
                    id: self.activeOrder.upd.supply_order_id,
                    supply_order_id: self.activeOrder.upd.supply_order_id,
                    supply_order_name: self.activeOrder.upd.supply_order_name,
                    updated_at: self.activeOrder.upd.updated_at,
                    updated_at_utc: self.activeOrder.upd.updated_at_utc,
                    order_date: self.activeOrder.upd.order_date,
                    order_form: self.activeOrder.upd.order_form,
                    priority: self.activeOrder.upd.priority,
                    site_id: self.activeOrder.upd.site_id,
                    site_name: self.activeOrder.upd.site_name,
                    site_address: self.activeOrder.upd.site_address,
                    special_instructions: self.activeOrder.upd.special_instructions,
                    remaining_budget: self.activeOrder.upd.remaining_budget
                  },{
                    locally_saved: self.activeOrder.upd
                  }));
                } else {
                  $.each(future_orders, function(i, ft){
                    if ($.inArray(String(ft.supply_order_id),
                        [String(self.activeOrder.upd.supply_order_id),
                          (undefined == mutation[self.activeOrder.upd.supply_order_id])? null :
                              String(mutation[self.activeOrder.upd.supply_order_id])] ) > -1 )
                    {
                      var order_to_update = {};

                      if (undefined != mutation[self.activeOrder.upd.supply_order_id]){
                        self.activeOrder.upd.supply_order_id = mutation[self.activeOrder.upd.supply_order_id];
                        self.activeOrder.upd.id = mutation[self.activeOrder.upd.supply_order_id];
                      }

                      order_to_update = $.extend(true, {
                        id: self.activeOrder.upd.supply_order_id,
                        supply_order_id: self.activeOrder.upd.supply_order_id,
                        supply_order_name: self.activeOrder.upd.supply_order_name,
                        updated_at: self.activeOrder.upd.updated_at,
                        updated_at_utc: self.activeOrder.upd.updated_at_utc,
                        order_date: self.activeOrder.upd.order_date,
                        order_form: self.activeOrder.upd.order_form,
                        priority: self.activeOrder.upd.priority,
                        site_id: self.activeOrder.upd.site_id,
                        site_name: self.activeOrder.upd.site_name,
                        site_address: self.activeOrder.upd.site_address,
                        special_instructions: self.activeOrder.upd.special_instructions,
                        remaining_budget: self.activeOrder.upd.remaining_budget
                      },{
                        locally_saved: self.activeOrder.upd
                      });

                      future_orders[i] = order_to_update;
                      return false;
                    }
                  });
                }
                app.myFutureOrders(future_orders);

/*                // локальный перерасчет бюджетов
                app.mySites((function(){
                  var mySites = app.mySites(),
                      short_order_form = self.activeOrder.upd.order_form.match(/^(.+?)\b/)[0].toLowerCase();
                  $.each(mySites, function(i,v){
                    try{
                      if (v.assigned){
                        if ("" === String(self.activeOrder.upd.site_id) || "paper" !== short_order_form )
                        {
                          mySites[i]["next_pending_"+short_order_form] = parseFloat(mySites[i]["next_pending_"+short_order_form])
                              + parseFloat(active_order_info.total);
                        } else {
                          if (v.site_id == self.activeOrder.upd.site_id){
                            for(var objkey in mySites[i]){
                              if ((new RegExp("^next_pending_"+short_order_form)).test(objkey)){
                                mySites[i][objkey] = parseFloat(mySites[i][objkey])
                                    + parseFloat(active_order_info.total);
                              }
                            }
                            return false;
                          }
                        }
                      }
                    } catch(er){}
                  });
                  return mySites;
                })());*/


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
                app.activeTab("next_month");
                app.route({
                  toPage: window.location.href + "#orders"
                });
              },0);
            }
          },
          "Future Order",
          'Cancel,Save'
      );

    });


  };

  this.initialize();
}

Handlebars.registerHelper("OrderOverallContent", function(order_obj){
  var out = "";
  if (!$.isEmptyObject(order_obj) && "undefined" != order_obj.id){
    var order = order_obj.upd,
        not_empty_items = false,
        total = 0;

    out = out + "<div data-role=\"content\">";
    out = out + "<div class=\"location_details\">";
    out = out + "<p><font>Order: "+ ((/^new_on_device/ig).test(order.supply_order_id)? '<em>-</em>': ('<strong>#' + order.supply_order_id + '</strong> from <strong>'+ (('' != order.order_date) ? order.order_date : '-') +'</strong>'));
    out = out + ((undefined !== order.status && "rejected" === order.status ) ? " <font style=\"font-size: 100%; color: red;\">(rejected)</font>" : "");
    out = out + "<br />"+order.site_name+"</font><br /><em>" + order.site_address + "</em></p>";
    out = out + "<p class=\"add_info\">Order type: <span>"+order.order_form+"</span>";

//    out = out + "<br />"+(("log" != order.order_status)?'Draft saved':'Submitted' )+": <span>"+ (('' != order.updated_at) ? order.updated_at : '-') +"</span>";
    out = out + "</p>";
    out = out + "</div>";

    // priority section
    if ("log" != order.order_status) {
      var priorities = [{
        shortcode: "normal",
        label: "Normal<br /><span>3 business days</span>",
        selected: ( undefined == order.priority || "normal" == order.priority.toLowerCase() )? true: false
      }, {
        shortcode: "high",
        label: "High<br /><span>2 business days</span>",
        selected: ( undefined != order.priority && "high" == order.priority.toLowerCase() )? true: false
      }, {
        shortcode: "urgent",
        label: "Urgent<br /><span>ASAP</span>",
        selected: ( undefined != order.priority && "urgent" == order.priority.toLowerCase() )? true: false
      }];

      out = out + "<div class=\"location_details priority_choice\"><div data-role=\"fieldcontain\">" +
        "<fieldset data-role=\"controlgroup\" data-type=\"horizontal\" data-role=\"fieldcontain\">" +
          "<legend>Priority:</legend>" +
          "<div class=\"priority-box\">";


      $.each(priorities, function(i,ob){
        out = out + "<div"+((ob.selected)? ' class="active"':'')+"><input type=\"radio\" name=\"priority\" id=\""+ ob.shortcode +"\" value=\""+ ob.shortcode +"\" "+ ((ob.selected)? 'checked="checked"':'') +" />";
        out = out + "<label for=\""+ ob.shortcode +"\">"+ ob.label +"</label></div>";
      });
      out = out + "</div></fieldset></div></div>";
    }

    out = out + "<div class=\"categories\">";

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

        if (amount > 0 ){

          category_out = category_out + "<li>" +
              "<span class=\"item_name\">" + item.serial_number +" - "+ item.description +"<br/>Measurement: "+ item.measurement +"<br/>" +
                "<div class=\"details\">Price: <span>$"+ price.toFixed(2) + "</span></div>" +
                "<div class=\"details\">Amount: <span>"+ amount + "</span></div>" +
                "<div class=\"details\">Total: <span>$"+ _total.toFixed(2) + "</span></div>" +
              "</span>" +
            "</li>";
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
    }

    //over budget
    out = out + "<div class=\"over_budget\">";
    out = out + "<div class=\"budget\">";
    if ("log" != order.order_status){
      out = out + "Budget: <span>$"+ parseFloat(order.remaining_budget).toFixed(2) +"</span><br />Remaining: <span class=\"remain\">$"+ parseFloat(order.remaining_budget - total).toFixed(2) +"</span>";
      out = out + "<div class=\"over\">"+ ((total>order.remaining_budget)?'Over Budget!!!':'') +"</div>";
    }
    out = out + "<div class=\"total\">";
    out = out + "<p>Total: <span class=\"price\">$"+total.toFixed(2)+"</span></p>";
    out = out + "</div>";
    out = out + "</div>";
    out = out + "</div>";

    // Special Instructions
    if ($.trim(order.special_instructions).length > 0) {
      out = out +"<div class=\"location_details\">";
      out = out +"<p><font>Special Instructions:</font></p>";
      out = out + "<p>" + order.special_instructions + "</p>";
      out = out +"</div>";
    }
    out = out +"</div>";

    if ("log" != order.order_status){
      out = out + "<table class=\"manage_area\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tr>";
      if ($.inArray(order.order_status, ["future", "new_future"])<0){
        out = out + "<td class=\"green_btn btnbox_1\"><button id=\"save_draft\">Save as Draft</button></td>"+
            "<td width=\"2%\">&nbsp;</td>"+
            "<td class=\"green_btn\"><button id=\"submit_to_vendor\">Submit to Vendor</button></td>";
      } else {
        out = out + "<td width=\"24%\">&nbsp;</td>"+
            "<td class=\"green_btn\"><button id=\"save_future\">Save as Future Order</button></td>" +
            "<td width=\"24%\">&nbsp;</td>";
      }
     out = out + "</tr></table>";
    }

    out = out + "</div>";
  }

  return new Handlebars.SafeString(out);
});

OrderOverallView.template = Handlebars.compile($("#order-overall-tpl").html());