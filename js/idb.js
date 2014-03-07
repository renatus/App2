//IndexedDB database name
var dbName = "jqm-todo";
//Database version (should be increased, when structure updates). Should be of integer type.
var dbVersion = 4;
var todoDB = {};
var indexedDB = window.indexedDB;

todoDB.indexedDB = {};
todoDB.indexedDB.db = null;
	


//Handle DB-related errors
todoDB.indexedDB.onerror = function(e) {
	console.log(e);
};



//Function to open DB and upgrade it's data structure, if needed
todoDB.indexedDB.open = function() {
	//Request to open database. Will return IDBOpenDBRequest object.
	var request = indexedDB.open(dbName, dbVersion);
	
	request.onsuccess = function(e) {
		console.log ("DB " + dbName + " was opened and ready for work");
        todoDB.indexedDB.db = e.target.result;
    }
        
    request.onupgradeneeded = function(e) {
		todoDB.indexedDB.db = e.target.result;
        var db = todoDB.indexedDB.db;
        console.log ("Going to upgrade DB from version "+ e.oldVersion + " to version " + e.newVersion);

		//If there is Object store with the same name at DB from previous revision, we'll face error while trying to upgrade DB
		//We should delete existing Object store (and all it's data, of course)
		//TODO: consider Object Store updating rather then recreating (versionchange transaction?)
        try {
			if (db.objectStoreNames && db.objectStoreNames.contains("todo")) {
				db.deleteObjectStore("todo");
			}
			
			if (db.objectStoreNames && db.objectStoreNames.contains("store2")) {
				db.deleteObjectStore("store2");
			}
        }
        catch (err) {
			console.log("Error in objectStoreNames: " + err);
        }
		
		//Create object store
		//Object Store is a storage for objects, instead of tables at SQL databases
		//We do not define objects structure here other than "fields" for keyPath, and for indexes
		//While adding objects, you can omit fields, including indexing ones, but keyPath field should be filled
		//We can make one of it's "fields" (with unique values) an in-line key with keyPath
        var store = db.createObjectStore("todo", {keyPath: "timeStamp"});
		// Create an index to search customers by text field. We may have duplicates so we can't use a unique index.
  		store.createIndex("todo", "todo", {unique: false});
		
		//Or we can make unique integer out-of-line keys (1,2,3 ...) with keyGenerator, enabled by {autoIncrement: true}
		var store = db.createObjectStore("store2", {autoIncrement: true});
        console.log("Onupgradeneeded: "+ JSON.stringify(store));
    }
       
    request.onfailure = function(e) {
		console.error("Failed to open DB: " + e);
	}
        
    request.onerror = function(e) {
		console.error("Error while opening DB: " + e);
	}
};

//Open DB and upgrade it's data structure, if needed
todoDB.indexedDB.open();



//Add entry to DB
todoDB.indexedDB.addEntry = function(todoText) {
	//Database table name
	var dbTableName = "todo";
	var db = todoDB.indexedDB.db;
	//Create transaction, define Object stores it will cover
    var transact = todoDB.indexedDB.db.transaction(dbTableName, "readwrite");
    var store = transact.objectStore(dbTableName);
	
    var data = {
		"text": todoText,
		"timeStamp": new Date().getTime()
    };
	
	//Request to store data at DB
	var request = store.put(data);

    request.onsuccess = function(e) {
		console.log('Data added to DB');
	};

    request.onerror = function(e) {
		console.error("Error Adding an item: ", e);
	};
};

todoDB.indexedDB.addEntry2 = function(todoText) {
	//Database table name
	var dbTableName = "todo";
	var db = todoDB.indexedDB.db;
	//Create transaction, define Object stores it will cover
    var transact = todoDB.indexedDB.db.transaction(dbTableName, "readwrite");
    var store = transact.objectStore(dbTableName);
	
    var data = {
		"last": todoText,
		"date": "date",
		"todo": 1,
		"timeStamp": new Date().getTime()
    };
	
	//Request to store data at DB
	var request = store.put(data);

    request.onsuccess = function(e) {
		console.log('Data added to DB');
	};

    request.onerror = function(e) {
		console.error("Error Adding an item: ", e);
	};
};



todoDB.indexedDB.getTodoItem = function(entryID) {
	//Database table name
	var dbTableName = "todo";
    var db = todoDB.indexedDB.db;
	//Create transaction
    var transact = db.transaction(dbTableName, "readonly");
    var store = transact.objectStore(dbTableName);

    //Get entry with matching key
	//keyRange is a continuous interval over keys, for example greater than X and smaller then Y
    var keyRange = IDBKeyRange.only(entryID);
	//Cursor is a mechanism for iterating over multiple records within a key range
    var cursorRequest = store.openCursor(keyRange);

    cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		alert(getObjProperties(result.value));
    };

    cursorRequest.onerror = todoDB.indexedDB.onerror;
};



todoDB.indexedDB.getAllTodoItems = function() {
	//Database table name
	var dbTableName = "todo";
    var db = todoDB.indexedDB.db;
	//Create transaction
    var transact = db.transaction(dbTableName, "readonly");
    var store = transact.objectStore(dbTableName);

    // Get everything in the store
	//keyRange is a continuous interval over keys, for example greater than X and smaller then Y
    var keyRange = IDBKeyRange.lowerBound(0);
	//Cursor is a mechanism for iterating over multiple records within a key range
    var cursorRequest = store.openCursor(keyRange);

    cursorRequest.onsuccess = function(e) {
		var result = e.target.result;
		//if(!!result == false) return;
		if(result){
			//Alert all found DB items (objects should be printed first)
			alert(getObjProperties(result.value));
			result.continue();
		}
    };

    cursorRequest.onerror = todoDB.indexedDB.onerror;
};



todoDB.indexedDB.deleteTodo = function(id) {
	//Database table name
	var dbTableName = "todo";
	var db = todoDB.indexedDB.db;
	//Create transaction
    var transact = db.transaction(dbTableName, "readwrite");
    var store = transact.objectStore(dbTableName);

    var request = store.delete(id);

    request.onsuccess = function(e) {
		todoDB.indexedDB.getAllTodoItems();
    };

    request.onerror = function(e) {
		console.error("Error deleteing: ", e);
	};
};



//Return list of all properties and it's values of received object
function getObjProperties(obj){
	var objPropertiesList = "";
	//Iterate through all properties
	for(i in obj){
		objPropertiesList = objPropertiesList + i + ": " + obj[i] + "\n";
	}
	return objPropertiesList;
}