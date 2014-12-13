AngularJS UI Form Validation (Bootstrap)
======

...

**Status of project:** (in development)  

## Library features

#### Define custom form validations and use the existing one from AngularJS and HTML5
````
app.config(function(uiFormValidationProvider) {
  uiFormValidationProvider.addFormValidation(
  {
    validationName: "agreementChecked",
    validate: function (value) {
      return value;
    }
  });
});
````
#### Declarative way of associating the validations to corresponding messages
````
// * matches all form controller names, it can be replaced for the specific one
{
    "*": {
        "agreementChecked": "You have to agree with terms."
    }
}
````
#### Possibility to store messages in the external files or load them dynamically at runtime
````
// First way
app.config(function(uiFormValidationProvider) {
  uiFormValidationProvider.addValidationErrorMessages("default", "custom.messages");
});

//Second way
app.run(function(validationErrorMessagesService) {
var validationErrorMessages = {'*' : {notTheSame: "Passwords are not the same."}};
  validationErrorMessagesService.addValidationErrorMessages("default", "custom/namespace/default.messages", validationErrorMessages);
});
````
#### Customizing validation error messages templates
````
// Definition of the detault one
app.config(function(uiFormValidationProvider) {
  uiFormValidationProvider.validationErrorsTemplate = "path/to/template.html";
});

// Per one control
<input ng-model="agreeWith" name="agreeWith" validation-errors-template="path/to/template.html" type="checkbox">

// Per whole form
<form class="form-horizontal" name="libAngularForm" validation-errors-template="path/to/template.html" ui-validation>
````
#### Automatic insertion/appending the validation error messages after specified elements 
````
// Using after - after{this} is default mode
<input ng-model="agreeWith" name="agreeWith" validation-errors-location="after{this}" type="checkbox">
<input ng-model="agreeWith" name="agreeWith" validation-errors-location="after{parent().parent()}" type="checkbox">

// Using append
<input ng-model="agreeWith" name="agreeWith" validation-errors-location="append{this}" type="checkbox">
<input ng-model="agreeWith" name="agreeWith" validation-errors-location="append{parent().parent()}" type="checkbox">

// Using explicit - does not insert anything
<input ng-model="agreeWith" name="agreeWith" validation-errors-location="explicit" type="checkbox">

// Per whole form
<form class="form-horizontal" name="libAngularForm" validation-errors-location="explicit" ui-validation>
````
#### Grouped insertion of the validation error messages from many controls in one place 
````
<div class="col-md-10" validation-errors="name3 date3" validation-controller="libAngularForm">
````
#### Modes when to display the validation error message
````
<input ng-model="agreeWith" name="agreeWith" validation-errors-mode="onInvalid" type="checkbox">
<input ng-model="agreeWith" name="agreeWith" validation-errors-mode="onSubmitAndInvalid" type="checkbox">
<input ng-model="agreeWith" name="agreeWith" validation-errors-mode="onDirtyAndInvalid" type="checkbox">

// Per whole form
<form class="form-horizontal" name="libAngularForm" validation-errors-mode="onInvalid" ui-validation>
````
#### Adding has-error class to the attached element via validation-notice and modes
````
<h5 validation-notice-mode="onInvalid" validation-notice="controlName">colored</h5>
<h5 validation-notice-mode="onInvalid" validation-notice="onSubmitAndInvalid">colored</h5>
<h5 validation-notice-mode="onInvalid" validation-notice="onDirtyAndInvalid">colored</h5>

// Per whole form
<form class="form-horizontal" name="libAngularForm" validation-notice-mode="onInvalid" ui-validation>
````
## Installation
#### Bower
````
bower install ui-form-validation
````

## Usage

  - Include script location inside HTML:
````
<script src="bower_components/ui-form-validation/dist/scripts/uiFormValidation.min.js"></script>
````
  - Add the `uiFormValidation` module in your application: 
````
angular.module("myModule", ["uiFormValidation"]); 
````

## Demos
  
Library package contains some demos located on `examples`.
  
**List of demos:**

&nbsp;&nbsp;&nbsp;[![Plunker](http://cdn.altrn.tv/icons/plunkr_29051.png?width=13&height=13)](http://plnkr.co/edit/ArMpukWIhDy0MEuNQA0p?p=preview) [`index.html`](http://plnkr.co/edit/ArMpukWIhDy0MEuNQA0p?p=preview) -- Simple form validation with the custom validation with corresponding validation message (Bootstrap)

&nbsp;&nbsp;&nbsp;[![Plunker](http://cdn.altrn.tv/icons/plunkr_29051.png?width=13&height=13)](http://plnkr.co/edit/ArMpukWIhDy0MEuNQA0p?p=preview) [`validation-errors.html`](http://plnkr.co/edit/nVmFVDwGW44aV2xMoKsU?p=preview) -- Examples how to insert validation errors messages into pages using various locations 


## Contact and credits
                             
**Author:**    Radim Loskot  
**gmail.com:** radim.loskot (e-mail)
