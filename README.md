JKinematics
===========

## About

JKinematics is a lightweight javacsript library, to manage transitions easily within the same html page.

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
- id : unique identifier - mandatory
- conditions : javascript array of objects corresponding to the conditions to be met to complete this phase - optional
- actions : javascript array of objects corresponding to all actions to be executed in this phase - optional

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
- id : unique identifier - mandatory
- conditions : javascript array of objects corresponding to the conditions to be met to complete this phase - optional
- phases : javascript array of objects corresponding to all phases in this step - mandatory


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

## Conditions

## Controllers

## Quick start
