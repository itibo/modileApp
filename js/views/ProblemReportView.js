var ProblemReportView = function(){

  this.render = function() {
    this.el.html(ProblemReportView.template());
    return this;
  };

  this.initialize = function() {
    var self = this;
    this.el = $('<div/>');

    this.el.on("click", ".manage_area #send", function(e){
      e.preventDefault();

      navigator.notification.confirm(
          "Do you want to send a report?",
          function(buttonIndex){
            if(2 == buttonIndex){
              var comment = {comment: ($("div[data-role=content] textarea#comment").val() || "")};
              app.collectLSDataAndSendToServer(comment, function(){
                navigator.notification.alert(
                    "Report was sent successfully.", // message
                    function(){},   // callback
                    "Send Report",    // title
                    'Ok'            // buttonName
                );
              });
            }
          },
          "Send Report",
          'Cancel,Send'
      );

    });
  };
  this.initialize();
}

ProblemReportView.template = Handlebars.compile($("#problem-report-tpl").html());