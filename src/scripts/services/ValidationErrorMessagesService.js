'use strict';

angular.module('uiFormValidation.services').service('validationErrorMessagesService', function (uiFormValidation, validationErrorMessages, utilsService, $locale, $templateCache, $cacheFactory, $parse, $compile, $rootScope, $log) {
  var $this = this;
  var validationErrorMessagesCache = $cacheFactory('validationErrorMessagesCache');
  
  this.invalidateCache = function (locale) {
    if (locale && locale != 'DEFAULT') {
      validationErrorMessagesCache.remove(locale);
    } else {
      validationErrorMessagesCache.removeAll();
    }
  };
  
  this.addValidationErrorMessages = function (locale, validationErrorMessagesName, validationErrorMessages) {
    var localeValidationErrorMessages = this.getValidationErrorMessages(locale);
    
    if (!localeValidationErrorMessages) {
      localeValidationErrorMessages = [];
      this.setValidationErrorMessages(locale, localeValidationErrorMessages);
    }
    
    localeValidationErrorMessages.push(validationErrorMessagesName);
    $templateCache.put(validationErrorMessagesName, validationErrorMessages);
    
    this.invalidateCache(locale);
  };
  
  this.removeValidationErrorMessages = function (locale, validationErrorMessagesName) {
    var localeValidationErrorMessages = this.getValidationErrorMessages(locale);
    
    if (!localeValidationErrorMessages) {
      $log.error("Validation error messages with given locale '" + locale + "' do not exist.");
      return;
    }
    
    var removeIndex = localeValidationErrorMessages.indexOf(validationErrorMessagesName);
    
    if (removeIndex == -1) {
      $log.error("Provider with name '" + validationErrorMessagesName + 
          "' of the error messages with given locale does not exist.");
      return;
    }
    
    localeValidationErrorMessages.splice(removeIndex, 1);
    $templateCache.remove(validationErrorMessagesName);
    
    this.invalidateCache(locale);
  };
   
  this.getErrorMessagesLocale = function () {
    if (uiFormValidation.validationErrorMessagesLocale) {
      return uiFormValidation.validationErrorMessagesLocale;
    } else {
      return $locale.id;
    }
  };
  
  this.getErrorMessagesLocaleKey = function (locale) {
    return locale.replace('-', '_').toUpperCase();
  };
  
  this.getValidationErrorMessages = function (locale) {
    var errorMessagesLocaleKey = this.getErrorMessagesLocaleKey(locale);
    return validationErrorMessages[errorMessagesLocaleKey];  
  };
  
  this.setValidationErrorMessages = function (locale, messages) {
    var errorMessagesLocaleKey = this.getErrorMessagesLocaleKey(locale);
    validationErrorMessages[errorMessagesLocaleKey] = messages;  
  };
  
  this.getLocalValidationErrorMessages = function (locale) {   
    var locale = (locale) ? locale : this.getErrorMessagesLocale();   
    var localeValidationErrorMessagesTemplateNames = this.getValidationErrorMessages(locale);  
    
    return this.getValidationErrorMessagesInstance(locale, localeValidationErrorMessagesTemplateNames);
  };
  
  this.getDefaultValidationErrorMessages = function () {
    return this.getValidationErrorMessagesInstance('DEFAULT', validationErrorMessages.DEFAULT);
  };
  
  this.getValidationErrorMessagesInstance = function (locale, validationErrorMessagesTemplateNames) {   
    var cachedValidationErrorMessages = validationErrorMessagesCache.get(locale);
    if (cachedValidationErrorMessages) {
      return cachedValidationErrorMessages;
    } else {
      var validationErrorMessagesInstance = {};
      angular.forEach(validationErrorMessagesTemplateNames, function (validationErrorMessagesTemplateName) {
        var validationErrorMessagesTemplate = $templateCache.get(validationErrorMessagesTemplateName);
        var validationErrorMessagesTemplateInstance = angular.fromJson(validationErrorMessagesTemplate);
        
        angular.extend(validationErrorMessagesInstance, validationErrorMessagesTemplateInstance);
      });
      
      /* Put default validation message if there is no translation */
      if (locale != 'DEFAULT') {
        var defaultValidationErrorMessages = this.getDefaultValidationErrorMessages();
        angular.forEach(defaultValidationErrorMessages, function (defaultValidationErrorMessage, key) {
          if (!validationErrorMessagesInstance[key]) {
            validationErrorMessagesInstance[key] = defaultValidationErrorMessage;
          }
        });
      }
      
      validationErrorMessagesCache.put(locale, validationErrorMessagesInstance);
      return validationErrorMessagesInstance;
    }
  };

  this.getControlErrors = function (scope, validationController, watchedControl, controlWrapper) {
    var controlErrors = {};
    controlErrors.control = controlWrapper.control;
    controlErrors.controlElement = controlErrors.controlElement;
    controlErrors.errors = {};
    
    if (controlWrapper.control && controlWrapper.control.$error) {
      angular.forEach(controlWrapper.control.$error, function (error, errorName) {
        var formValidation = uiFormValidation.formValidations[errorName];
        var validationErrorMessages = $this.getLocalValidationErrorMessages();
        var validationErrorContext = {
            validationName: errorName, 
            validationValue: undefined,
            controlValue: undefined,
            control: controlWrapper,
            validationController: validationController,
            errorMessages: validationErrorMessages,
            scope: scope.$parent,
            errorsScope: scope
        };
        
        scope.$watch(function () {
          return controlWrapper.control.$viewValue || controlWrapper.control.$modelValue;
        }, function (newValue) {
          validationErrorContext.controlValue = newValue;
        });
        
        var errorMessage = null;
        if (watchedControl.errors && watchedControl.errors.indexOf(errorName) == -1) {
          delete controlErrors.errors[errorName];
        } else if (error && formValidation) {
          var errorNameAttr = utilsService.camelToSnakeCase(errorName, "-");
          validationErrorContext.validationValue = controlWrapper.controlElement.attr(errorNameAttr);
          
          if (formValidation.errorMessage) {
            errorMessage = formValidation.errorMessage;
            if (typeof errorMessage === 'Function') {
              errorMessage = errorMessage(validationErrorContext);
            }
          } else {
            errorMessage = validationErrorMessages[errorName];
          }
        } else if (error) {
          errorMessage = validationErrorMessages[errorName] || validationErrorMessages['__default__'];
        };
        
        if (errorMessage) {
          if (typeof errorMessage === 'Function') {
            errorMessage = errorMessage(validationErrorContext);
          }
          
          controlErrors.errors[errorName] = {
              validationErrorContext: validationErrorContext,
              errorMessage: errorMessage
          };
        }
      });
    }
    
    return controlErrors;
  };
  
});