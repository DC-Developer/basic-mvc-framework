/**
  Before we can parse the html, we are going to need to target an element node, and then recursively
  traverse through its node tree and store the tree in memory. Once in memory, we can parse the tree
  for the passed in controller names and their functions and relate that to the user's instantiated
  controller and respective methods.
*/

var $scope = {
  controllers: {
    controller: {
      numbers: [12375, 3433, 42523]
    },
    controller2: {
      numbers: [42824, 23221, 865545]
    }
  }
};

/**
*parser -- parses string values, looking for the {{}} binding indicators and saving everything within it in memory to send
           to another function, determining if it matches any logic or data bindings in our $scope object
*@param {string} str - html-like string
*/
function parser(str) {
  if (!str) {
      return false;
  }

  let tempString = "";
  let holder = "";

  for (let i=0, l=str.length; i<l; i++) {
      tempString += str[i];

      if (tempString.indexOf("{{") > -1 && str[i] !== "{" && tempString.indexOf("}") === -1) {
        holder += str[i];
      }
  }
  return holder;
}

/**
  *convertToArray - speaks for itself
  *@param {str} - passed in string containing array indicators
*/
function convertToArray(str) {
  if (!str) {
      return false;
  }
  let splitStr;

  splitStr = str.split("[");

  return {
    arrayName: splitStr[0],
    index: parseInt(splitStr[1].replace("]", ""))
  }
}

/**
  *@param {object} el - html node, treated as root in tree traversal algorithm
  *@param {function} cb - callback function that takes in specified node
*/
function traverseDOM(el, cb){
  /**
    for future dom parsing, caching the dom will make for quicker re-writes. also being able to check diffs
    between the dom and current state will be easier
  */
  Object.keys(el.attributes).forEach(prop => {
    if (el.attributes[prop].name === "ng-controller") {
       state.controllers.push({
         elementName: el.attributes[prop].name,
         nodeNumber: prop,
         controllerName: el.attributes[prop].value
       });
      cb(el);
    }
  })

  el = el.firstElementChild;

  while(el){
    traverseDOM(el, cb);
    el = el.nextElementSibling;
  };

}

/**
  *@param {object} node - html element node
  *@param {function} cb - callback function to perform logic on specified node
*/
function traverseNodeForBindings(node, cb){
  node = node.firstElementChild;

  if (node) {
      cb(node);
  }

  while(node) {
     traverseNodeForBindings(node, cb);
     node = node.nextElementSibling;

     if (node) {
        cb(node);
     }
  }
}

//this here is for testing purposes -- will seperate this into seperate modules, but use this as reference
var root = document.documentElement;

traverseDOM(root, function(element){
  //this will pass in the controller element, and recursively loop through its nodes
  traverseNodeForBindings(element, function(node) {
    if (node.innerHTML) {
        //now pass in the innerHTML of the node and add the databinding
        let parsedDataBinding = parser(node.innerHTML);
        let arrayObj;

        //check if the data is an array type
       //this way is error prone, due to object being able to use [] as property accessors
       //just using this currently to quickly test
        if (parsedDataBinding.indexOf("[") > -1) {
            arrayObj = convertToArray(parsedDataBinding);
        }
        var controllerArray = $scope.controllers[element.attributes[0].value][arrayObj.arrayName];
        var data;

        //now locate the data binder in the $scope object
        for (let i=0; i<controllerArray.length; i++) {
            if (i == arrayObj.index) {
                data = controllerArray[i];
            }
        }

        //now replace with the data
        node.innerHTML = node.innerHTML.replace(node.innerHTML, data)
    }
  });

});

//next goal is to create observables to detect changes in state and update the dom accordingly
