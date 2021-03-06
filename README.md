JKinematics
===========

## About

JKinematics is a lightweight javascript library, to manage transitions easily within the same html page.

## Transitions

Two transition levels can be defined: steps and phases.

A step is formed of one or more phases.

Phase contains actions which are executed sequentially.

When all actions within a phase are performed, the next phase is executed.

When all the phases in a single step are carried out, the next step is executed.

Conditions can be set for each step or phase of the kinematics.

If one of them is not satisfied, step or phase to which it applies will not be executed.

## Phase

A phase is defined using a javascript object which may contain the following attributes:

- `id` : unique identifier - mandatory
- `conditions` : javascript array of objects corresponding to the conditions to be met to complete this phase - optional
- `actions` : javascript array of objects corresponding to all actions to be executed in this phase - optional

``` javascript
var actions = [];
// ...
var phase = {
    id  : 'step1phase1',
    conditions : [],
    actions : actions
};
```

## Step

A step is defined using a javascript object which may contain the following attributes:

- `id` : unique identifier - mandatory
- `conditions` : javascript array of objects corresponding to the conditions to be met to complete this phase - optional
- `phases` : javascript array of objects corresponding to all phases in this step - mandatory


``` javascript
var phases = [];
phases.push(phase);
// ...
var step = {
    id  : 'step1',
    conditions : [],
    phases  : phases
};
```

``` html
		<div id="step1" style="display: none;">
			<h1>step 1</h1>
			<div id="step1phase1" style="display: none;">
				<h2>phase 1</h2>
				<input type="button" value="next" class="next" />
			</div>
			...
		</div>
```

## Action

An action is defined using a javascript object which may contain the following attributes:

- `mode` : type of action to be executed - mandatory
- `controller` : defining the name of the controller which defines the javascript function to be call - may be defined when the `mode` attribute is equal to call
- `script` : the javascript function to be called or javscript code to be run - mandatory when the `mode` attribute is equal respectively to call or execute
- `timeout` : time expressed in millisecond during which the normal flow of execution of the kinematic will be suspended. After this time, the kinematics will automatically resume its execution flow. - mandatory when the `mode` attribute is equal to wait

### Mode

The `mode` attribute can take the following values:

- `stop`: stops the normal flow of execution of the kinematics. Resuming execution of the kinematics requires an explicit request from the client. An action of this type is added by default to the list of actions defined for each phase.
- `wait`: suspends the normal flow of execution of the kinematics for the time specified using the `timeout` attribute.
- `call`: calls the javascript function specified using the `script` attribute that may be defined within a controller using the `controller` attribute.
- `execute`: runs javascript code specified using the `script` attribute.

## Conditions

## Controllers

## Quick start

## License
(The MIT License)

Copyright (c) 2012 Stéphane Manciot <stephane.manciot@gmail.com>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
