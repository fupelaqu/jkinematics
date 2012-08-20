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

## Step

A step is defined using a javascript object which may contain the following attributes:
	id (unique identifier - mandatory)
	conditions (javascript array of objects corresponding to the conditions to be met to perform this step - optional)
	phases (javascript array of objects corresponding to all phases in this step - mandatory)

## Phase

A phase is defined using a javascript object which may contain the following attributes:
	id (unique identifier - mandatory)
	conditions (javascript array of objects corresponding to the conditions to be met to complete this phase - optional)
	shares (javascript array of objects corresponding to all actions to be executed in this phase - optional)

## Actions

## Conditions

## Controllers

## Quick start
