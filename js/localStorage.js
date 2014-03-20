$.extend(app, {

  /* start: nearest locations filter */
  nearestLocationsFilter: function(data){
    var out = void 0;
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("nearestLocationsFilter", data);
        out = data;
      } else {
        window.localStorage.removeItem("nearestLocationsFilter");
        out = {};
      }
    } else {
      out = window.localStorage.getItem("nearestLocationsFilter") ? window.localStorage.getItem("nearestLocationsFilter") : (void 0);
    }
    return out;
  },
/* end: nearest locations filter */

/* start: my sites filter */
  sitesFilters: function(data){
    var out = void 0;
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("sitesFilters", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("sitesFilters");
        out = {};
      }
    } else {
      out = window.localStorage.getItem("sitesFilters") ? JSON.parse(window.localStorage.getItem("sitesFilters")) : {};
    }
    return out;
  },
/* end: my sites filter */

/* ------------------------- */
// suppllier main page helper
  supplierMainPageHelper: function(data){
    var out = {};
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("supplierMainPageHelper", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("supplierMainPageHelper");
        out = {};
      }
    } else {
      out = window.localStorage.getItem("supplierMainPageHelper") ? JSON.parse(window.localStorage.getItem("supplierMainPageHelper")) : {};
    }
    return out;
  },

  // sites filter
  siteFilter: function(data){
    var out = void 0,
        helper = app.supplierMainPageHelper();
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        out = helper.site_id = data;
        app.supplierMainPageHelper(helper);
      } else {
        out = helper.site_id = void 0;
        app.supplierMainPageHelper(helper);
      }
    } else {
      out = helper.site_id;
    }
    return out;
  },

  // active tab
  activeTab: function(data){
    var out = void 0,
        helper = app.supplierMainPageHelper();
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        out = helper.active_tab = data;
        app.supplierMainPageHelper(helper);
      } else {
        out = helper.active_tab = "drafts";
        app.supplierMainPageHelper(helper);
      }
    } else {
      out = helper.active_tab || "drafts";
    }
    return out;
  },

  // my_sites
  mySites: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("mySites", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("mySites");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("mySites") ? JSON.parse(window.localStorage.getItem("mySites")) : [];
    }
    return out;
  },

  // sitesStaffingInfo
  sitesStaffingInfo: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("sitesStaffingInfo", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("sitesStaffingInfo");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("sitesStaffingInfo") ? JSON.parse(window.localStorage.getItem("sitesStaffingInfo")) : [];
    }
    return out;
  },

  //supply_orders_template
  supplyOrdersTemplate: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("supplyOrdersTemplate", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("supplyOrdersTemplate");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("supplyOrdersTemplate") ? JSON.parse(window.localStorage.getItem("supplyOrdersTemplate")) : [];
    }
    return out;
  },

  // orders drafts
  mySupplyOrdersDrafts: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("mySupplyOrdersDrafts", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("mySupplyOrdersDrafts");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("mySupplyOrdersDrafts") ? JSON.parse(window.localStorage.getItem("mySupplyOrdersDrafts")) : [];
    }
    return out;
  },

  // future orders
  myFutureOrders: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("myFutureOrders", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("myFutureOrders");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("myFutureOrders") ? JSON.parse(window.localStorage.getItem("myFutureOrders")) : [];
    }
    return out;
  },

  // last submitted orders
  myLastSubmittedOrders: function(data){
    var out = [];
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("myLastSubmittedOrders", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("myLastSubmittedOrders");
        out = [];
      }
    } else {
      out = window.localStorage.getItem("myLastSubmittedOrders") ? JSON.parse(window.localStorage.getItem("myLastSubmittedOrders")) : [];
    }
    return out;
  },

  // current active order
  activeOrder: function(data){
    var out = {};
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("activeOrder", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("activeOrder");
        out = {};
      }
    } else {
      out = window.localStorage.getItem("activeOrder") ? JSON.parse(window.localStorage.getItem("activeOrder")) : {};
    }
    return out;
  },

  // last sync date
  last_sync_date: function(data){
    var out = null;
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("last_sync_date", data);
        out = data;
      } else {
        window.localStorage.removeItem("last_sync_date");
        out = null;
      }
    } else {
      out = window.localStorage.getItem("last_sync_date") ? window.localStorage.getItem("last_sync_date") : null;
    }
    return out;
  },

  // ids mutations object
  ids_mutation: function(data){
    var out = {};
    if (typeof data != "undefined"){
      data = data || false;
      if (data){
        window.localStorage.setItem("ids_mutation", JSON.stringify(data));
        out = data;
      } else {
        window.localStorage.removeItem("ids_mutation");
        out = {};
      }
    } else {
      out = window.localStorage.getItem("ids_mutation") ? JSON.parse(window.localStorage.getItem("ids_mutation")) : {};
    }
    return out;
  },

  cancell_inspection: function(data){
    if (typeof data != "undefined"){
      window.localStorage.setItem("cancellInspection", JSON.stringify(data));
      return;
    } else {
      return window.localStorage.getItem("cancellInspection") ? JSON.parse(window.localStorage.getItem("cancellInspection")) : false;
    }
  },


  // сайты, доступные к инспекции
  sitesToInspect: function(){
    return window.localStorage.getItem("sitesToInspect") ? JSON.parse(window.localStorage.getItem("sitesToInspect")) : [];
  },

  setSitesToInspect: function(data, i){
    if (typeof i != "undefined"){
      var savetSitesToInspect = app.sitesToInspect();
      if ( "last" == i ){
        savetSitesToInspect.push(data);
        data = savetSitesToInspect;
      } else {
        savetSitesToInspect[i] = data;
        data = savetSitesToInspect;
      }
    }
    window.localStorage.setItem("sitesToInspect", JSON.stringify(data));
    return;
  },

  token: function(){
    return window.localStorage.getItem("token") ? window.localStorage.getItem("token") : false;
  },

  setToken: function(new_value){
    if (new_value){
      window.localStorage.setItem("token", new_value);
    } else {
      window.localStorage.removeItem("token");
      app.setUserInfo(false);
    }
    return;
  },

  savedCheckList: function(data){
    if (typeof data != "undefined"){
      data = data || false;
      if (data) {
        window.localStorage.setItem("savedCheckList", JSON.stringify(data));
      } else {
        window.localStorage.removeItem("savedCheckList");
      }
      return;
    } else {
      return window.localStorage.getItem("savedCheckList") ? JSON.parse(window.localStorage.getItem("savedCheckList")) : {};
    }
  },

  setJobInspectionContainer: function(data){
    var data = data || false;
    var new_val;
    var job_container = {
      id: null,
      job_id: null,
      site_id: null,
      status: "",
      started_at: false,
      completed_at: false,
      container: []
    };

    if (data.id){
      new_val = $.extend(job_container, data);
    } else {
      new_val = job_container;
      app.savedCheckList(false);
    }
    window.localStorage.setItem("jobInspection", JSON.stringify(new_val));
    return new_val;
  },

  getJobInspectionContainer: function(){
    var job_container = {
      id: null,
      job_id: null,
      site_id: null,
      status: "",
      started_at: false,
      completed_at: false,
      container: []
    };
    return window.localStorage.getItem("jobInspection") ? JSON.parse(window.localStorage.getItem("jobInspection")) : job_container;
  },

  setUserInfo: function(obj){
    if (obj){
      window.localStorage.setItem("userInfo", JSON.stringify(obj));
    } else {
      window.localStorage.removeItem("userInfo");
    }
  },

  getUserInfo: function(){
    return window.localStorage.getItem("userInfo") ? JSON.parse(window.localStorage.getItem("userInfo")) : {};
  },

  setPushID: function(push_id){
    if (push_id){
      window.localStorage.setItem("push_id", push_id);
    } else {
      window.localStorage.removeItem("push_id");
    }
    return;
  },

  getPushID: function(){
    return window.localStorage.getItem("push_id") ? window.localStorage.getItem("push_id") : false;
  }

});