'use strict';

angular.module('uiFormValidation.directives').directive('uiValidation', function (validationErrorMessagesService, $parse, uiFormValidation, validationErrorsModes, validationNoticeModes, validationErrorsLocationFactories, utilsService, $compile, $injector) {
  var uniqueId = 1;
  return {
    restrict: 'A',
    require: ['uiValidation', 'form'],
    controller: function ($scope, $injector, $element) {
      var validationErrorsLocationFactoryInstances = [];
      
      angular.forEach(validationErrorsLocationFactories, function (factoryName) {
        validationErrorsLocationFactoryInstances.push($injector.get(factoryName));
      });
    
      this.controllerName = $element.attr("name") || "uiValidation_" + uniqueId++;
      this.initialized = false;
      this.isSubmited = false;
      this.initializationCallbacks = [];
    
      this.formController = undefined;
      this.formElement = undefined;
      this.controls = {};
    
      this.validationNoticeMode = uiFormValidation.validationNoticeMode;
    
      //this.controlsErrors = undefined;
      this.validationErrorsMode = uiFormValidation.validationErrorsMode;
      this.validationErrorsLocation = uiFormValidation.validationErrorsLocation;
      this.validationErrorsTemplate = uiFormValidation.validationErrorsTemplate;
      
      var $this = this;
      this.initialize = function (formController, formElement) {   
        $this.controllerName = formController.$name || $this.controllerName; 
        $this.formController = formController;
        $this.formElement = formElement;
        
        // Decorate form controller
        var original$addControl = formController.$addControl;
        formController.$addControl = function (control) {
          original$addControl(control);
          $this.addControl(control);
        };
        
        angular.forEach(formController, function (control, controlName) {
          if (control && control.hasOwnProperty('$modelValue')) {
            $this.addControl(control);
          }
        });
        
        $this.initialized = true;
        
        angular.forEach($this.initializationCallbacks, function (fn, index) {
          fn();
        });
      };
      
      this.addControl = function (control) {
        if (!control.$name || control.$name === "") {
          return;
        }
      
        var controlWrapper = {};
            
        var controlElement   = this.formElement[0].querySelector('[name="' + control.$name + '"]');
        controlElement = angular.element(controlElement);
        
        controlWrapper.control = control;
        controlWrapper.controlElement = controlElement;
        controlWrapper.validationNoticeMode = undefined;
        controlWrapper.validationErrorsMode = undefined;
        controlWrapper.validationErrorsLocation = undefined;
        controlWrapper.validationErrorsTemplate = undefined;
        
        $this.controls[control.$name] = controlWrapper;
      };
      
      this.afterInitialized = function (fn) {
        if (this.initialized) {
          fn();
        } else {
          this.initializationCallbacks.push(fn);
        }
      };
      
      this.getValidationProperty = function (controlName, property) {
        if (!$this.controls[controlName]) {
          throw "Control with given name " + controlName + " does not exist.";
        }
        
        var controlPropertyValue = $this.controls[controlName][property];
        if (!controlPropertyValue) {
          return $this[property];
        } else {
          return controlPropertyValue;
        }
      };
      
      this.getValidationErrorsMode = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsMode');
      };
      
      this.getValidationNoticeMode = function (controlName) {
        return this.getValidationProperty(controlName, 'validationNoticeMode');
      };
      
      this.getValidationErrorsTemplate = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsTemplate');
      };
      
      this.getValidationErrorsLocation = function (controlName) {
        return this.getValidationProperty(controlName, 'validationErrorsLocation');
      };
      
      this.hasControlErrors = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var selectorErrorNames = controlAndErrorSelector.errors;
        var controlWrapper = this.controls[selectorControlName];

        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var isInvalid = false;
        
        if (!selectorErrorNames) {
          isInvalid = controlWrapper.control.$invalid;
        } else {
          angular.forEach(selectorErrorNames, function(errorName) {
            if (controlWrapper.control.$error[errorName]) {
              isInvalid = true;
            } 
          });
        }
        
        return isInvalid;
      };
      
      this.hasControlsErrors = function (controlAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.hasControlErrors(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.shouldNoticeForControlSelector = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var validationNoticeMode = this.getValidationNoticeMode(selectorControlName);
        var controlWrapper = this.controls[selectorControlName];
        var isInvalid = this.hasControlErrors(controlAndErrorSelector);
        
        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var onSubmitAndInvalid = false;
        var onDirtyAndInvalid = false;
        var onInvalid = false;
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onSubmitAndInvalid) !== -1) {
          onSubmitAndInvalid = this.isSubmited && isInvalid;
        }
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onDirtyAndInvalid) !== -1) {
          onDirtyAndInvalid = controlWrapper.control.$dirty && isInvalid;
        }
        
        if (validationNoticeMode.indexOf(validationNoticeModes.onInvalid) !== -1) {
          onInvalid = isInvalid;
        }

        return (onSubmitAndInvalid || onDirtyAndInvalid || onInvalid);
      };
      
      this.shouldNoticeForControlSelectors = function (controlsAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlsAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.shouldNoticeForControlSelector(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.shouldDisplayValidationErrorsForControlSelector = function (controlAndErrorSelector) {
        var selectorControlName = controlAndErrorSelector.controlName;
        var validationErrorsMode = this.getValidationErrorsMode(selectorControlName);
        var controlWrapper = this.controls[selectorControlName];
        var isInvalid = this.hasControlErrors(controlAndErrorSelector);
        
        if (!controlWrapper) {
          throw "Control with name '" + selectorControlName + "' does not exist.";
        }
        
        var onSubmitAndInvalid = false;
        var onDirtyAndInvalid = false;
        var onInvalid = false;
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onSubmitAndInvalid) !== -1) {
          onSubmitAndInvalid = this.isSubmited && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onDirtyAndInvalid) !== -1) {
          onDirtyAndInvalid = controlWrapper.control.$dirty && isInvalid;
        }
        
        if (validationErrorsMode.indexOf(validationErrorsModes.onInvalid) !== -1) {
          onInvalid = isInvalid;
        }

        return (onSubmitAndInvalid || onDirtyAndInvalid || onInvalid);
      };
      
      this.shouldDisplayValidationErrorsForControlSelectors = function (controlsAndErrorSelectors) {
        var hasErrors = false;
        
        angular.forEach(controlsAndErrorSelectors, function(controlAndErrorSelector) {
          if ($this.shouldDisplayValidationErrorsForControlSelector(controlAndErrorSelector)) {
            hasErrors = true;
          }
        });
        
        return hasErrors;
      };
      
      this.getParsedValidationErrorsLocation = function (controlName) {
        var validationErrorsLocation = this.getValidationErrorsLocation(controlName);
        var parsedValidationErrorsLocation = {name: "", args: []};
        
        var parseRegexp = /^\s*(.*?)\s*(\{\s*([^\{\}]*?)\s*\})?$/;
        var match = parseRegexp.exec(validationErrorsLocation);
        if (match !== null && match.length === 4) {
            parsedValidationErrorsLocation.name = match[1].trim();
            parsedValidationErrorsLocation.args = match[3]? match[3].split(",") : [];
        } else {
            throw "Unable to parse validation errors location - '" + validationErrorsLocation + "'.";
        }
        
        return parsedValidationErrorsLocation;
      };
      
      this.getFormOrControlWrapper = function (element) {
        if ($this.formElement[0] === element[0]) {
          return $this;
        }
        
        var result;
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          if (!result && controlWrapper.controlElement[0] === element[0]) {
            result = controlWrapper;
          } 
        });
        
        return result;
      };
      
      this.injectValidationErrors = function () {
        angular.forEach($this.controls, function (controlWrapper, controlName) {
          var validationErrorsElement = angular.element("<div></div>");
          validationErrorsElement.attr('validation-errors', controlName);
          validationErrorsElement.attr('validation-controller', $this.controllerName);   
          validationErrorsElement.attr('validation-errors-template', $this.getValidationErrorsTemplate(controlName));   
          
          var parsedValidationErrorsLocation = $this.getParsedValidationErrorsLocation(controlName);
          
          angular.forEach(validationErrorsLocationFactoryInstances, function (validationErrorsLocationFactory) {
            if (validationErrorsLocationFactory.name === parsedValidationErrorsLocation.name) {
              var link = null;
              if (validationErrorsLocationFactory.compile) {
                if (typeof validationErrorsLocationFactory.compile !== 'function') {
                  throw "Validation attribute compile is not function.";
                }
                
                link = validationErrorsLocationFactory.compile(validationErrorsElement, parsedValidationErrorsLocation.args);
              } else {
                link = $compile(validationErrorsElement);
              }
              
              link($scope, function(clonedValidationErrorsElement) {
                if (validationErrorsLocationFactory.link) {
                  if (typeof validationErrorsLocationFactory.link !== 'function') {
                    throw "Validation attribute link is not function.";
                  }
                  
                  validationErrorsLocationFactory.link($scope, clonedValidationErrorsElement, controlWrapper, parsedValidationErrorsLocation.args);
                }
              });
            }
          });
        });
      };
      
      /* FIXME: Implementation is not sufficient */
      this.bindSubmitEvent = function () {
        this.formElement.bind('submit', function () {
          $scope.$apply(function () {
            $this.submit();
          });
        });
      };
      
      this.validate = function () {
        angular.forEach(this.controls, function(controlWrapper) {
          var viewValue = controlWrapper.control.$viewValue;
          controlWrapper.control.$setViewValue(viewValue);
        });
      };
      
      /* FIXME: Implementation is not sufficient */
      this.submit = function () {
        var ngSubmit = this.formElement.attr("ng-submit");
        
        if (ngSubmit) {
          this.isSubmited = true;
          $scope.$eval(ngSubmit);
        }
      };
    },
    controllerAs: 'uiValidationController',
    link: function(scope, formElement, attrs, controllers) {
      var validationController = controllers[0];
      var formController = controllers[1];
      
      formElement.attr("novalidate", true);

      validationController.initialize(formController, formElement);
      validationController.injectValidationErrors();
      validationController.bindSubmitEvent();
      
      utilsService.addValidationController(scope, validationController);
    }
  };
});