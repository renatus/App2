//Controller to work with activities
app.controller('bodyconditionController', function ($scope, $rootScope, $q, $routeParams, indexedDBexo, UUID4) {
    //Get all entries from $rootScope and put them to $scope object to use all AngularJS goodness (not always possible with $rootScope)
    //$scope.bodycondition = $rootScope.exo.bodycondition;



    //Method to add new Body Condition report entry to $scope and DB
    $scope.addEntry = function(bodycondition){
        console.log($scope);
        //bodyconditionService.save();
    }

});
