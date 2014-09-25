//Controller to work with tags
app.controller('tagsController', function ($scope, $rootScope, $q, $routeParams, indexedDBexo, UUID4) {

    //Get all entries from $rootScope and put them to $scope object
    $scope.tags = $rootScope.exo.tags;

    $scope.inputs = [1];

    $scope.addArrItem = function(){
        $scope.inputs.push($scope.inputs.length + 1);
    }



    //Add new tag entry to $scope and DB
    //You can get user-entered field value without passing object to function with construction like $scope.tag.title
    $scope.addEntry = function(tag){
        var curTimestamp = new Date().getTime();
        //Get universally unique identifier for a new entry
        var entryID = UUID4.generate();
        //Entry language code (like 'en')
        var langcode = tag.langcode;

        //Create entry object
        var newEntry = {
            "uuid": entryID,
            //Entry is new, so revision number is "0"
            "lastVersion": 0,
            //Looks like we should not bother about timezone here
            //Mark entry as updated locally, by putting in last update timestamp
            "lastUpdatedLocally": curTimestamp,
            "0": {
                "title": {},
                "urllink": [],
                "langcode": $scope.tag.langcode,
                "createdTimeStamp": curTimestamp,
                "modifiedTimeStamp": curTimestamp
            }
		};
        //Set entry title
        //Entry is new, so revision number is "0"
        newEntry["0"]["title"][langcode] = tag.title;

        //Set URLlink URL and title
        //Entry is new, so revision number is "0"
        var newArrElement = {'url':$scope.tag.urllink, "title":{'en': 'EnTitle'} };
        newEntry["0"]["urllink"].push(newArrElement);

        //Clean form from now saved user-entered data
        this.tag = {};

        //Add new entry to DB
        indexedDBexo.addEntry(newEntry, "tags").then(function(){
            console.log('Tag saved to DB!');
        });

        //Add new entry to $scope
        $scope.tags.push(newEntry);
    }



    //Edit tag entry at $scope and DB
    $scope.editEntry = function(tag, langcode){
        var curTimestamp = new Date().getTime();
        //Get revision number of now-previous entry revision
        var prevVersion = tag["lastVersion"];
        //Generate current entry revision number
        var curVersion = tag["lastVersion"] + 1;

        //Create temporary object to populate and push to $scope and DB
        tag[curVersion] = {};
        //At first current revision will be the same as previous
        tag[curVersion] = angular.copy(tag[tag["lastVersion"]]);
        //Timestamp of a moment entry was modified
        tag[curVersion]["modifiedTimeStamp"] = curTimestamp;

        //If user have changed entry's language, we should change it for all language-specific properties
        //without creation dupes, such as en: "Title" ru: "Title"
        var oldLangcode = tag[tag["lastVersion"]]["langcode"];
        if (oldLangcode != langcode){
            //Set entry's new langcode
            tag[curVersion]["langcode"] = langcode;
            //Create title copy with different langcode
            tag[curVersion]["title"][langcode] = tag[curVersion]["title"][oldLangcode];
            //Title value is not an object, so it'll not be copied by reference, so it's safe to delete original title value in a new revision
            delete tag[curVersion]["title"][oldLangcode];
        }

        //Set entry's new revision number
        tag["lastVersion"] = curVersion;
        //Restore now-previous version, as it was modified while user edited activity
        tag[prevVersion] = angular.copy(this.editTagLastRev);


        //Update entry at DB
        indexedDBexo.addEntry(tag, "tags").then(function(){
            console.log('Tag edited!');
        });

        //Update entry at $scope
        for (var i = 0; i < $scope.activities.length; i++){
            //If edited tag UUID is equal to found tag UUID
            if ($scope.tags[i].uuid == tag.uuid){
                //Update entry at $scope
                $scope.tags[i] = angular.copy(tag);
                //Stop searching through all $scope entries
                break;
            }
        }

        //Clean form from now saved user-entered data
        delete this.editTagLastRev;
        //Delete temporary object to populate and push to $scope and DB
        delete tag;
    }



    //Delete tag entry at $scope and DB
    $scope.deleteEntry = function(tag){
        //Delete entry at DB
        indexedDBexo.deleteEntry(tag, "tags").then(function(){
            //Delete entry at $scope
            $scope.tags.splice($scope.tags.indexOf(tag), 1 );
            console.log('Tag deleted!');
        });
    }
});



//Controller to show single tag on a subpage
app.controller('showTagController', function($scope, $routeParams) {
    //Get parameter value from the URL
    var tagID = $routeParams.tagId;
    //Set current tag ID
    $scope.tagID = tagID;

    //We should watch for changes at tag to show it when it is fully loaded from DB
    //Loading from DB is async, so $scope.tags will be empty in case we're loadind tag page from the start
    //Tag will be updated, right after it was changed
    $scope.$watch("tags", function(newValue, oldValue) {
        //If tag is fully loaded
        if ($scope.tags){
            //Search through all tags
            for (var i = 0; i < $scope.tags.length; i++){
                //If watched tag UUID is equal to found tag UUID
                if ($scope.tags[i].uuid == tagID){
                    //Copy found tag object to temporary subobject
                    $scope.tag = angular.copy($scope.tags[i]);
                    //Stop searching through all $scope entries
                    break;
                }
            }
        }
    });
});



//Directive to generate activity edit form
app.directive("editTag", function() {

    return {
        //Directive can be used as (element) Attribute or (custom) Element
        restrict: "AE",
        replace: true,
        //Form HTML template
        templateUrl: "templates/tag-edit.html",
        controller: function($scope) {
            //We have to copy tag subobject to bind it to edit form - to prevent changes from taking immediate effect, prior to pressing Save button
            //If we'll modify activity directly, entry and edit form may disappear, if modified entry should be hidden by ng-repeat filters
            $scope.editTag = angular.copy($scope.tag);
            $scope.editTagLangcode = angular.copy($scope['tag'][$scope['tag']['lastVersion']]['langcode']);
            $scope.editTagLastRev = angular.copy($scope['tag'][$scope['tag']['lastVersion']]);

        }
    };
});