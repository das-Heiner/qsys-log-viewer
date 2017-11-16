angular.module('logbrowse', [])

  .directive("fileread", [function () {
    return {
      scope: {
        fileread: "=",

      },
      link: function (scope, element, attributes) {
        element.bind("change", function (changeEvent) {
          var reader = new FileReader();
          reader.onload = function (loadEvent) {
            scope.$apply(function () {
              scope.fileread(loadEvent.target.result);
            });
          }
          reader.readAsArrayBuffer(changeEvent.target.files[0]);
        });
      }
    }
  }])

  .controller('FileController', function($scope) {

    $scope.files = {};
    $scope.page = 'upload';

    $scope.go = function(page) {
      $scope.page = page;
    }

    $scope.parse = function(gzip) {

      var tar = pako.inflate(gzip);

      untar(tar.buffer)

        .then(function(files) {

          $scope.$apply(function() {

            delete $scope.siplog;
            delete $scope.syslog;
            delete $scope.evtlog;

            var syslog, evtlog;

            angular.forEach(files, function(file) {

              // SIP Trace
              if(file.name == 'var/lib/freeswitch/log/freeswitch.log' || file.name == 'var/log/freeswitch/freeswitch.log') {
                $scope.siplog = new TextDecoder('utf-8').decode(file.buffer);
              }

              // System log handler
              if(file.name.startsWith('media/log/messages')) {
                syslog = [];
                var index = parseInt(file.name.substr(19)) + 1;
                if(isNaN(index)) { index = 0; }
                syslog[index] = new TextDecoder('utf-8').decode(file.buffer);
              }

              // Event log handler
              if(file.name.startsWith('var/designs/current_design/settings/event_log_2')) {
                if(!evtlog) { evtlog = []; }
                evtlog[file.name] = new TextDecoder('utf-8').decode(file.buffer);
              }

            });

            if(syslog) {
              $scope.syslog = '';
              for(var i = syslog.length-1; i >= 0; i--) {
                $scope.syslog += syslog[i];
              }
            }

            if(evtlog) {
              evtlog = evtlog.sort(function(a,b) { return a < b; }); // sort event logs;
              $scope.evtlog = '';
              for(var i in evtlog) {
                $scope.evtlog += evtlog[i] + '\n\n';
              }
            }

          });

          /*var sip_trace = $scope.files['var/lib/freeswitch/log/freeswitch.log'];
          var syslog_fh = $scope.files['media/log/messages'];
          var evtlog_fh = $scope.files['var/designs/current_design/event_log_head.xml'];

          $scope.$apply(function() {
            
            if(sip_trace) {  }
            if(syslog_fh) { $scope.syslog = String.fromCharCode.apply(null, new Uint8Array(syslog_fh.buffer)); }
            if(evtlog_fh) { $scope.evtlog = String.fromCharCode.apply(null, new Uint8Array(evtlog_fh.buffer)); }
          });*/

        }, function(err) {
          console.error(err);
        })

    }

  });