var ProblemReportView = function(){

  this.render = function() {
    this.el.html(ProblemReportView.template());
    return this;
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div/>');

    this.el.on("click", "#send", function(e){
      e.preventDefault();

      if (!e.currentTarget.clicked) {
        e.currentTarget.clicked = true;
        navigator.notification.confirm(
            "Do you want to send a report?",
            function(buttonIndex){
              if(2 == buttonIndex){
                var comment = {comment: ($("div[data-role=content] textarea#comment").val() || "")};
                app.collectLSDataAndSendToServer(comment, function(){
                  navigator.notification.alert(
                      "Report was sent successfully.", // message
                      function(){
                        app.route({toPage: window.location.href + "#welcome"})
                      },   // callback
                      "Send Report",    // title
                      'Ok'            // buttonName
                  );
                });
              }
              e.currentTarget.clicked = false;
            },
            "Send Report",
            ['Cancel','Send']
        );
      }
    });
  };
  this.initialize();
}

ProblemReportView.template = Handlebars.compile($("#problem-report-tpl").html());