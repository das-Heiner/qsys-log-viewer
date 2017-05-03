angular.module('logbrowse', [])

  .run(function() {
    console.log('browsing');
  })

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

          angular.forEach(files, function(file) {
            $scope.files[file.name] = file;
          });

          var sip_trace = $scope.files['var/lib/freeswitch/log/freeswitch.log'];

          $scope.$apply(function() {
            $scope.tracePresent = !!sip_trace;
            if(sip_trace) {
              $scope.siplog = String.fromCharCode.apply(null, new Uint8Array(sip_trace.buffer));
            } else {
              alert('No SIP trace was present in the log file.');
            }
          });

        }, function(err) {
          console.error(err);
        })

    }

  });