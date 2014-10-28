'use strict';

angular.module('uiFormValidation.constants', []);
angular.module('uiFormValidation.values', []);
angular.module('uiFormValidation.providers', []);

angular.module('uiFormValidation.services', [  
  'uiFormValidation.constants',
  'uiFormValidation.values'
]);

angular.module('uiFormValidation.factories', [  
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services'
]);

angular.module('uiFormValidation.controllers', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',
  'uiFormValidation.factories'
]);

angular.module('uiFormValidation.directives', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',
  'uiFormValidation.factories',
  'uiFormValidation.controllers'
]);

angular.module('uiFormValidation', [
  'uiFormValidation.constants',
  'uiFormValidation.values',
  'uiFormValidation.services',,
  'uiFormValidation.factories',
  'uiFormValidation.controllers',
  'uiFormValidation.directives',
  'uiFormValidation.providers',
  'ngSanitize'
]);

/*
 * TODO: Refactor and make more services e.g. some registry for validation notice and errors + service 
 *       maintaining custom validation directives, notice modes, validation modes etc.
*/

