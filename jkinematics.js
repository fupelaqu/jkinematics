/*
|--------------------------------------------------------------------------
| JKinematics 0.1
| https://github.com/fupelaqu/jkinematics
|--------------------------------------------------------------------------
 */

// Closure
(function(window) {

    // Global variables
    var console = window.console || {}, document = window.document;

    console.log = console.log || function() {
    }, console.warn = console.warn || function() {
    }, console.error = console.error || function() {
    }, console.info = console.info || function() {
    };

    /* begin functions */

    function asArray(args, start) {
        var result = [];
        for ( var i = (start || 0); i < args.length; i++)
            result.push(args[i]);
        return result;
    }

    function forEach(array, action) {
        // support for additional arguments required by the action to perform
        // for each element within the array
        var fixedArgs = asArray(arguments, 2);
        var copy = [].concat(array);
        for ( var i = 0; i < array.length; i++) {
            action.apply(null, [ array[i], i, copy ].concat(fixedArgs));
        }
    }

    function forEachIn(object, action) {
        var fixedArgs = asArray(arguments, 2);
        for ( var property in object) {
            if (Object.prototype.hasOwnProperty.call(object, property)
                    && Object.prototype.propertyIsEnumerable.call(object,
                            property))
                action.apply(null, [ property, object[property] ]
                        .concat(fixedArgs));
        }
    }

    function copy(target, source) {
        forEachIn(source, function(name, value) {
            target[name] = value;
        });
        return target;
    }

    function partial(func) {
        var fixedArgs = asArray(arguments, 1);
        return function() {
            return func.apply(null, fixedArgs.concat(asArray(arguments)));
        };
    }

    function compose(func1, func2) {
        return function() {
            return func1(func2.apply(null, arguments));
        };
    }

    var op = {
        "===" : function(a, b) {
            return a === b;
        },
        "==" : function(a, b) {
            return a == b;
        },
        "!" : function(a) {
            return !a;
        }
    };

    // var isNumber = compose(op["!"], isNaN);
    var isUndefined = partial(op["=="], undefined);
    var isDefined = compose(op["!"], isUndefined);
    var isEqual = partial(op['===']);
    var isNotEqual = compose(op["!"], isEqual);

    /**
     * javascript loader
     */
    var loadScript = function(url, callback) {
        var head = document.getElementsByTagName('head')[0]
                || document.documentElement;
        var done = false;
        var script = document.createElement("script");
        script.setAttribute("type", "text/javascript");
        script.src = url;
        script.onload = script.onreadystatechange = function() {
            if (!done
                    && (!this.readyState || isEqual(this.readyState, "loaded") || isEqual(
                            this.readyState, "complete"))) {

                done = true;

                // Prevent IE memory leaking
                script.onload = script.onerror = script.onreadystatechange = null;
                head.removeChild(script);

                if (isDefined(callback) && isEqual(typeof callback, 'function')) {
                    callback.call(this, null, this.readyState);
                }
            }
        };
        head.insertBefore(script, head.childNodes[0]);
    };

    /* end functions */

    /* begin State class */

    function State() {
        this.target = null, this.step = null, this.phase = null;
    }

    /* end State class */

    /* begin Kinematics class */

    function Kinematics() {
        this.target = null, // targeted element including kinematics
        this.debug = false, // flag to print messages to the console
        this.steps = null, // all current steps within the kinematics
        this.originalSteps = null, // all steps defined for this kinematics
        this.currentStep = null, // current step within the kinematics
        this.currentPhase = null, // current phase within the current step
        this.currentAction = null, // current action within the current phase
        this.currentCondition = null, // current condition within the current
        // step or phase
        this.next = false, this.back = false;
    }

    Kinematics.prototype.executeAction = function(action) {
        var ret = true;
        var self = this;
        if (isDefined(action)) {

            // console.log('executeAction ['+action.mode+']');

            switch (action.mode) {
            case 'wait':
                // suspends the normal flow of execution of the kinematics for
                // the time specified using the timeout attribute
                ret = false;
                setTimeout(function() {
                    self.resume();
                }, action.timeout);
                break;
            case 'stop':
                // stops the normal flow of execution of the kinematics.
                // Resuming execution of the kinematics requires an explicit
                // request from the client.
                ret = false;
                break;
            case 'call':
                // calls the javascript function specified using the script
                // attribute that may be defined within a controller using the
                // controller attribute.
                var script = eval((action.controller ? action.controller
                        : 'window')
                        + '.' + action.script);
                if (isDefined(script) && isEqual(typeof script, 'function')) {
                    try {
                        ret = isDefined(action.not) && eval(action.not) ? !script
                                .call(this)
                                : script.call(this);
                    } catch (err) {
                        ret = false;
                    }
                } else {
                    ret = false;
                }
                break;
            case 'execute':
                // runs javascript code specified using the script attribute.
                try {
                    ret = eval(action.script);
                } catch (err) {
                    ret = false;
                }
                break;
            case 'empty':
                ret = JKinematics.Adapter.emptyElt(action.target);
                break;
            case 'replace':
                ret = JKinematics.Adapter.replaceElt(action.target,
                        action.content);
                break;
            case 'prepend':
                ret = JKinematics.Adapter.prependElt(action.target,
                        action.content);
                break;
            case 'append':
                ret = JKinematics.Adapter.appendElt(action.target,
                        action.content);
                break;
            case 'show':
                ret = JKinematics.Adapter.showElt(action.target);
                break;
            case 'hide':
                ret = JKinematics.Adapter.hideElt(action.target);
                break;
            default:
                ret = false;
                break;
            }
        }
        return ret;
    };

    Kinematics.prototype.executeActions = function() {
        var ret = true;
        if (isDefined(this.currentPhase)
                && isDefined(this.currentPhase.actions)
                && this.currentPhase.actions.length > 0) {
            do {
                this.currentAction = this.currentPhase.actions[0];
                ret = this.executeAction(this.currentAction);
                if (!ret) {
                    if (isEqual(this.currentAction.mode, 'stop')
                            || isEqual(this.currentAction.mode, 'wait')) {
                        // stop and wait actions are executed only once
                        this.currentPhase.actions.splice(0, 1);
                    }
                    break;
                } else {
                    this.currentPhase.actions.splice(0, 1);
                }
            } while (this.currentPhase.actions.length > 0);
        }
        return ret;
    };

    Kinematics.prototype.checkConditions = function(conditions) {
        var ret = true;
        if (isDefined(conditions) && conditions.length > 0) {
            do {
                this.currentCondition = conditions[0];
                ret = this.executeAction(this.currentCondition);
                if (!ret) {
                    break;
                } else {
                    conditions.splice(0, 1);
                }
            } while (conditions.length > 0);
        }
        return isUndefined(conditions)
                || (ret && isEqual(conditions.length, 0));
    };

    Kinematics.prototype.resume = function() {
        this.nextPhase();
    };

    Kinematics.prototype.nextPhase = function() {
        var ret = true;
        if (isDefined(this.currentStep) && isDefined(this.currentStep.phases)
                && this.currentStep.phases.length > 0) {
            // loop until the current phase
            do {
                var previousPhase = this.currentPhase;
                var newPhase = this.currentStep.phases[0];
                var phaseChange = false;
                if (isUndefined(previousPhase)
                        || isNotEqual(previousPhase.id, newPhase.id)) {
                    if (isDefined(previousPhase)) {
                        phaseChange = true;
                    }
                    // transition to the next phase
                    this.currentPhase = newPhase;
                    if (isUndefined(this.currentPhase.step)) {
                        this.currentPhase.step = this.currentStep.id;
                    }
                    if (isUndefined(this.currentPhase.previousPhase)) {
                        this.currentPhase.previousPhase = previousPhase;
                    }
                    if (isUndefined(this.currentPhase.previousActions)) {
                        this.currentPhase.previousActions = newPhase.actions
                                .slice(0);
                    }
                    if (isUndefined(this.currentPhase.previousConditions)) {
                        this.currentPhase.previousConditions = newPhase.conditions
                                .slice(0);
                    }
                }

                if (this.debug) {
                    console.log('nextPhase [' + this.currentStep.id + ','
                            + this.currentPhase.id + ']');
                }

                // application of pre-conditions
                var checkConditions = this
                        .checkConditions(this.currentPhase.conditions);
                if (!checkConditions) {
                    this.currentPhase.skipped = true;
                }
                ret = checkConditions && this.executeActions();
                if (!ret && !this.currentPhase.skipped) {
                    if (phaseChange) {
                        if (isDefined(previousPhase) && previousPhase.skipped
                                && isDefined(previousPhase.previousPhase)) {
                            do {
                                previousPhase = previousPhase.previousPhase;
                            } while (isDefined(previousPhase.previousPhase)
                                    && previousPhase.skipped);
                        }
                        JKinematics.Adapter.removeEltClass(this.target,
                                previousPhase.id);
                        // we hide the view corresponding to the previous phase
                        JKinematics.Adapter.hideElt(previousPhase.id);
                    }

                    if ((phaseChange || isUndefined(previousPhase))
                            && isDefined(History)) {
                        var state = new State();
                        state.target = this.target;
                        state.step = this.currentStep.id;
                        state.phase = this.currentPhase.id;
                        var title = this.currentPhase.title;
                        var url = '?target=' + state.target + '&step='
                                + state.step + '&phase=' + state.phase;
                        History.pushState(state, title, url);
                    }

                    JKinematics.Adapter.addEltClass(this.target,
                            this.currentPhase.id);
                    // we show the view corresponding to the current phase
                    JKinematics.Adapter.showElt(this.currentPhase.id);
                    document.title = this.currentPhase.title;
                    break;
                } else {
                    this.currentStep.phases.splice(0, 1);
                    if (this.currentPhase.skipped) {
                        ret = true;
                    }
                }
            } while (this.currentStep.phases.length > 0);
        }
        // back to previous phase
        if (this.back) {
            this.previousPhase();
        }
        // handle replay
        if (!ret && isDefined(this.replay) && isDefined(this.replayTimeout)) {
            if (eval(this.replay)) {
                this.currentPhase.actions.splice(0, 0, {
                    mode : 'wait',
                    timeout : this.replayTimeout
                });
                this.replay = null;
                this.replayTimeout = null;
                return this.nextPhase();
            }
        }
        /***********************************************************************
         * // skip current phase --> go to next phase
         * if(this.currentPhase.skipped){ ret = this.nextPhase(); }
         **********************************************************************/
        // no more phases within current step --> go to next step, if any
        if (isDefined(this.currentStep)
                && (isUndefined(this.currentStep.phases) || isEqual(
                        this.currentStep.phases.length, 0))) {
            ret = (this.currentPhase.skipped || ret) && this.nextStep();
        }
        return ret;
    };

    Kinematics.prototype.previousPhase = function() {
        this.back = false;
        var currentPhase = this.currentPhase;
        var currentStep = this.currentStep;
        if (isDefined(currentPhase) && isDefined(currentStep)) {

            if (this.debug) {
                console.log('previousPhase [' + this.currentStep.id + ','
                        + this.currentPhase.id + ']');
            }

            // reset current phase conditions
            if (isDefined(currentPhase.previousConditions)) {
                currentPhase.conditions = currentPhase.previousConditions
                        .slice(0);
            }
            // reset current phase actions
            if (isDefined(currentPhase.previousActions)) {
                currentPhase.actions = currentPhase.previousActions.slice(0);
            }
            // reset current phase within current step
            currentStep.phases.splice(0, 1, currentPhase);

            var previousPhase = currentPhase.previousPhase;

            if (isDefined(previousPhase)) {

                if (isNotEqual(currentStep.id, previousPhase.step)) {
                    if (isDefined(currentStep.previousStep)) {
                        do {
                            // back to previous step
                            currentStep = currentStep.previousStep;
                            currentStep.skipped = null;
                            if (isDefined(currentStep.previousConditions)) {
                                currentStep.conditions = currentStep.previousConditions
                                        .slice(0);
                            }
                            // add previous step
                            this.steps.splice(0, 0, currentStep);
                        } while (isDefined(currentStep.previousStep)
                                && isNotEqual(currentStep.id,
                                        previousPhase.step));
                    }
                }

                // previous phases which have been previously skipped may be
                // relevant now
                if (previousPhase.skipped) {
                    do {
                        previousPhase.skipped = null;
                        // add previous skipped phase within current step
                        currentStep.phases.splice(0, 0, previousPhase);
                        previousPhase = previousPhase.previousPhase;
                        // reset previous phase conditions (not necessary to
                        // reset previous phase actions because they have not
                        // been executed)
                        previousPhase.conditions = previousPhase.previousConditions
                                .slice(0);
                        if (isNotEqual(currentStep.id, previousPhase.step)) {
                            if (isDefined(currentStep.previousStep)) {
                                do {
                                    // back to previous step
                                    currentStep = currentStep.previousStep;
                                    currentStep.skipped = null;
                                    currentStep.conditions = currentStep.previousConditions
                                            .slice(0);
                                    // add previous step
                                    this.steps.splice(0, 0, currentStep);
                                } while (isDefined(currentStep.previousStep)
                                        && isNotEqual(currentStep.id,
                                                previousPhase.step));
                            }
                        }
                    } while (previousPhase.skipped);
                }

                var stepChange = isNotEqual(this.currentStep.id, currentStep.id);
                // update current step
                if (stepChange) {
                    JKinematics.Adapter.removeEltClass('step_'
                            + this.currentStep.id, 'currentStep');
                    // we hide the view corresponding to the previous step
                    JKinematics.Adapter.hideElt(this.currentStep.id);
                    JKinematics.Adapter.addEltClass('step_' + currentStep.id,
                            'currentStep');
                    // we show the view corresponding to the current step
                    JKinematics.Adapter.showElt(currentStep.id);
                    this.currentStep = currentStep;
                }

                // update current phase
                // reset previous phase conditions
                if (isDefined(previousPhase.previousConditions)) {
                    previousPhase.conditions = previousPhase.previousConditions
                            .slice(0);
                }
                // reset previous phase actions
                if (isDefined(previousPhase.previousActions)) {
                    previousPhase.actions = previousPhase.previousActions
                            .slice(0);
                }
                // add previous phase within current step
                currentStep.phases.splice(0, 0, previousPhase);
                JKinematics.Adapter
                        .removeEltClass(this.target, currentPhase.id);
                // we hide the view corresponding to the previous phase
                JKinematics.Adapter.hideElt(currentPhase.id);
                JKinematics.Adapter.addEltClass(this.target, previousPhase.id);
                // we show the view corresponding to the current phase
                JKinematics.Adapter.showElt(previousPhase.id);
                this.currentPhase = previousPhase;

                document.title = this.currentPhase.title;

                this.nextPhase();

                if (stepChange && isDefined(History)) {
                    var state = new State();
                    state.target = this.target;
                    state.step = this.currentStep.id;
                    state.phase = this.currentPhase.id;
                    var title = this.currentPhase.title;
                    var url = '?target=' + state.target + '&step=' + state.step
                            + '&phase=' + state.phase;
                    History.pushState(state, title, url);
                }
            }
        }
    };

    Kinematics.prototype.nextStep = function() {
        var ret = true;
        if (this.steps.length > 0) {
            var previousStep = this.currentStep;
            // step change
            var stepChange = false;
            var newStep = this.steps[0];
            if (isUndefined(previousStep)
                    || isNotEqual(previousStep.id, newStep.id)) {
                if (isDefined(previousStep)) {
                    stepChange = true;
                }
                this.currentStep = newStep;
                this.currentStep.previousConditions = newStep.conditions
                        .slice(0);
                this.currentStep.previousStep = previousStep;
            }

            if (this.debug) {
                console.log('nextStep [' + this.currentStep.id + ']');
            }

            var next = isDefined(this.currentStep)
                    && (isUndefined(this.currentStep.phases) || isEqual(
                            this.currentStep.phases.length, 0));

            // application of pre-conditions
            var checkConditions = this
                    .checkConditions(this.currentStep.conditions);
            if (!checkConditions) {
                this.currentStep.skipped = true;
            }

            ret = checkConditions && !next && this.nextPhase();

            if (!ret && !this.currentStep.skipped && !next) {
                if (stepChange) {
                    if (isDefined(previousStep) && previousStep.skipped) {
                        do {
                            previousStep = previousStep.previousStep;
                        } while (previousStep.skipped);
                    }
                    // update step
                    JKinematics.Adapter.removeEltClass('step_'
                            + previousStep.id, 'currentStep');
                    // we hide the view corresponding to the previous step
                    JKinematics.Adapter.hideElt(previousStep.id);

                }

                if ((stepChange || isUndefined(previousStep))
                        && isDefined(History)) {
                    var state = new State();
                    state.target = this.target;
                    state.step = this.currentStep.id;
                    state.phase = this.currentPhase.id;
                    var title = this.currentPhase.title;
                    var url = '?target=' + state.target + '&step=' + state.step
                            + '&phase=' + state.phase;
                    History.pushState(state, title, url);
                }

                // update step
                JKinematics.Adapter.addEltClass('step_' + this.currentStep.id,
                        'currentStep');
                // we show the view corresponding to the current step
                JKinematics.Adapter.showElt(this.currentStep.id);
            } else {
                if (this.steps.length > 1) {
                    this.steps.splice(0, 1);
                } else {
                    next = false;
                }
                if (this.currentStep.skipped) {
                    ret = true;
                } else if (next) {
                    ret = this.nextStep();
                }
            }

        }
        return ret;
    };

    Kinematics.prototype.resetStep = function(_currentStep, _previousPhase) {
        if (isDefined(_currentStep)) {
            if (isUndefined(_currentStep.previousConditions)) {
                _currentStep.previousConditions = _currentStep.conditions
                        .slice(0);
            }
            forEach(_currentStep.phases, function(_tempPhase) {
                _tempPhase.step = _currentStep.id;

                if (isUndefined(_tempPhase.previousConditions)) {
                    _tempPhase.previousConditions = _tempPhase.conditions
                            .slice(0);
                } else {
                    _tempPhase.conditions = _tempPhase.previousConditions
                            .slice(0);
                }

                if (isUndefined(_tempPhase.previousActions)) {
                    _tempPhase.previousActions = _tempPhase.actions.slice(0);
                } else {
                    _tempPhase.actions = _tempPhase.previousActions.slice(0);
                }

                if (isUndefined(_tempPhase.previousPhase)
                        && isDefined(_previousPhase)
                        && isNotEqual(_tempPhase.id, _previousPhase.id)) {
                    _tempPhase.previousPhase = _previousPhase;
                }

                _previousPhase = _tempPhase;
            });

        }
        return _previousPhase;
    };

    Kinematics.prototype.resetSteps = function() {

        var self = this;

        var clone = new Array();
        forEach(this.originalSteps, function(step) {
            var phases = new Array();
            forEach(step.phases, function(phase) {
                var actions = new Array();
                forEach(phase.actions, function(action) {
                    actions.push(copy({}, action));
                });
                actions.push({
                    mode : 'stop'
                }); // requires an explicit request from the client
                var conditions = new Array();
                forEach(phase.conditions, function(condition) {
                    conditions.push(copy({}, condition));
                });
                var p = copy({}, phase);
                p.actions = actions;
                p.conditions = conditions;
                if (isDefined(self.currentPhase)
                        && isEqual(self.currentPhase.id, phase.id)) {
                    self.currentPhase = p;
                }
                phases.push(p);
            });
            var conditions = new Array();
            forEach(step.conditions, function(condition) {
                conditions.push(copy({}, condition));
            });
            var s = copy({}, step);
            s.conditions = conditions;
            s.phases = phases;
            if (isDefined(self.currentStep)
                    && isEqual(self.currentStep.id, step.id)) {
                self.currentStep = s;
            }
            clone.push(s);
        });

        this.steps = clone;

        var _previousStep = null;
        var _previousPhase = null;

        forEach(this.steps, function(_currentStep) {
            _previousPhase = self.resetStep(_currentStep, _previousPhase);
            if (isDefined(_previousStep)) {
                _currentStep.previousStep = _previousStep;
            }
            _previousStep = _currentStep;
        });
    };

    Kinematics.prototype.goTo = function(step, phase) {

        if (this.debug) {
            console.log('goTo [' + step + ',' + phase + ']');
        }

        var ret = true;

        var oldStep = this.currentStep;
        var newStep = null;

        var oldPhase = this.currentPhase;
        var newPhase = null;

        this.resetSteps();

        if (this.steps.length > 0) {
            // loop until the new step
            do {
                var tempStep = this.steps[0];
                if (isEqual(tempStep.id, step)) {
                    newStep = tempStep;
                    break;
                }
                this.steps.splice(0, 1);
            } while (this.steps.length > 0);
        }

        var stepChange = false;

        if (isDefined(newStep)) {

            stepChange = isDefined(oldStep) && isNotEqual(oldStep.id, step);

            if (stepChange) {
                if (oldStep.skipped && isDefined(oldStep.previousStep)) {
                    do {
                        oldStep = oldStep.previousStep;
                    } while (oldStep.skipped && isDefined(oldStep.previousStep));
                }
                // update step
                JKinematics.Adapter.removeEltClass('step_' + oldStep.id,
                        'currentStep');
                // we hide the view corresponding to the previous step
                JKinematics.Adapter.hideElt(oldStep.id);
            }

            if (isUndefined(newStep.previousConditions)) {
                newStep.previousConditions = newStep.conditions.slice(0);
            } else {
                newStep.conditions = newStep.previousConditions.slice(0);
            }

            // update current step
            this.currentStep = newStep;

            // update step
            JKinematics.Adapter.addEltClass('step_' + this.currentStep.id,
                    'currentStep');
            // we show the view corresponding to the current step
            JKinematics.Adapter.showElt(this.currentStep.id);

            if (newStep.phases.length > 0) {
                // loop until the new phase
                do {
                    var tempPhase = newStep.phases[0];
                    if (isEqual(tempPhase.id, phase)) {
                        newPhase = tempPhase;
                        break;
                    }
                    newStep.phases.splice(0, 1);
                } while (newStep.phases.length > 0);
            }
        }

        var phaseChange = false;

        if (isDefined(newPhase)) {

            if (isUndefined(newPhase.previousActions)) {
                newPhase.previousActions = newPhase.actions.slice(0);
            } else {
                newPhase.actions = newPhase.previousActions.slice(0);
            }

            if (isUndefined(newPhase.previousConditions)) {
                newPhase.previousConditions = newPhase.conditions.slice(0);
            } else {
                newPhase.conditions = newPhase.previousConditions.slice(0);
            }

            // update current phase
            this.currentPhase = newPhase;

            document.title = newPhase.title;

            phaseChange = isDefined(oldPhase) && isNotEqual(oldPhase.id, phase);

            if (phaseChange) {
                if (oldPhase.skipped && isDefined(oldPhase.previousPhase)) {
                    do {
                        oldPhase = oldPhase.previousPhase;
                    } while (oldPhase.skipped
                            && isDefined(oldPhase.previousPhase));
                }
                JKinematics.Adapter.removeEltClass(this.target, oldPhase.id);
                // we hide the view corresponding to the previous phase
                JKinematics.Adapter.hideElt(oldPhase.id);

            }

            JKinematics.Adapter.addEltClass(this.target, this.currentPhase.id);
            // we show the view corresponding to the current phase
            JKinematics.Adapter.showElt(this.currentPhase.id);

            // on exŽcute la phase atteinte
            ret = this.nextPhase();

            if (stepChange && isDefined(History)) {
                var state = new State();
                state.target = this.target;
                state.step = this.currentStep.id;
                state.phase = this.currentPhase.id;
                var title = this.currentPhase.title;
                var url = '?target=' + state.target + '&step=' + state.step
                        + '&phase=' + state.phase;
                History.pushState(state, title, url);
            }

        }

        return ret;
    };

    Kinematics.prototype.init = function(steps, step, phase) {
        this.originalSteps = steps;

        this.resetSteps();

        JKinematics.Adapter.hideElt(this.target);

        var currentStep = this.currentStep;
        if (isDefined(currentStep)) {
            if (currentStep.skipped && isDefined(currentStep.previousStep)) {
                do {
                    currentStep = currentStep.previousStep;
                } while (currentStep.skipped
                        && isDefined(currentStep.previousStep));
            }
            JKinematics.Adapter.removeEltClass('step_' + currentStep.id,
                    'currentStep');
            // we hide the view corresponding to the current step
            JKinematics.Adapter.hideElt(currentStep.id);
        }

        var currentPhase = this.currentPhase;
        if (isDefined(currentPhase)) {
            if (currentPhase.skipped && isDefined(currentPhase.previousPhase)) {
                do {
                    currentPhase = currentPhase.previousPhase;
                } while (currentPhase.skipped
                        && isDefined(currentPhase.previousPhase));
            }
            JKinematics.Adapter.removeEltClass(this.target, currentPhase.id);
            // we hide the view corresponding to the current phase
            JKinematics.Adapter.hideElt(currentPhase.id);
        }

        var element = document.getElementById(this.target);

        if (isDefined(element)) {
            var self = this;

            forEach(JKinematics.Adapter.getByClass(element, 'back'), function(
                    back) {
                JKinematics.Adapter.attach(back, 'click', function() {
                    self.previousPhase();
                }, false);
            });

            forEach(JKinematics.Adapter.getByClass(element, 'next'), function(
                    back) {
                JKinematics.Adapter.attach(back, 'click', function() {
                    self.nextPhase();
                }, false);
            });
        }

        if (isDefined(step) && isDefined(phase)) {
            this.goTo(step, phase);
        } else {
            this.nextStep();
        }

        JKinematics.Adapter.showElt(this.target);
    };

    /* JKinematics */

    JKinematics = function() {
        this.values = [];
    };

    JKinematics.prototype.store = function(target, options) {
        var self = this;
        var value = this.lookup(target);
        options = copy({
            steps : [],
            step : null,
            phase : null,
            debug : false,
            scripts : []
        }, options);
        var steps = options.steps;
        var step = options.step;
        var phase = options.phase;
        var debug = options.debug;
        var scripts = options.scripts;
        var loadScripts = function(scripts) {
            if (scripts && scripts.length > 0) {
                loadScript(scripts[0], function(data, status) {
                    scripts.splice(0, 1);
                    loadScripts(scripts);
                });
            } else {
                setTimeout(
                        function() {
                            value = isDefined(value) ? value : new Kinematics();
                            value.target = target;
                            value.debug = debug;
                            value.init(steps.slice(0), step, phase);
                            self.values[target] = value;

                            /**
                             * handle history
                             */
                            var handleStateChange = function(data) {
                                if (isDefined(data)) {
                                    var target = data.target, step = data.step, phase = data.phase;
                                    if (isDefined(target) && isDefined(step)
                                            && isDefined(phase)) {
                                        var kinematics = jkinematics
                                                .lookup(target);
                                        if (isDefined(kinematics)) {
                                            var currentStep = isDefined(kinematics.currentStep) ? kinematics.currentStep.id
                                                    : null;
                                            var currentPhase = isDefined(kinematics.currentPhase) ? kinematics.currentPhase.id
                                                    : null;
                                            if (isNotEqual(currentStep, step)
                                                    || isNotEqual(currentPhase,
                                                            phase)) {
                                                kinematics.goTo(step, phase);
                                            }
                                        }
                                    }
                                }
                            };

                            var History = window.History;
                            if (isDefined(History) && History.enabled) {
                                // Bind to StateChange Event
                                History.Adapter
                                        .bind(window, 'statechange',
                                                function() {
                                                    var State = History
                                                            .getState();
                                                    if (debug) {
                                                        History.log(State.data,
                                                                State.title,
                                                                State.url);
                                                    }
                                                    var data = State.data;
                                                    handleStateChange(data);
                                                });
                            }

                        }, 1);
            }
        };
        loadScripts(scripts);
    };

    JKinematics.prototype.lookup = function(target) {
        return this.values[target];
    };

    JKinematics.prototype.contains = function(target) {
        return Object.prototype.hasOwnProperty.call(this.values, target)
                && Object.prototype.propertyIsEnumerable.call(this.values,
                        target);
    };

    var jkinematics = new JKinematics();

    window.JKinematics = jkinematics;

    /* JKinematics.Adapter */

    if (isUndefined(JKinematics.Adapter)) {
        JKinematics.Adapter = {
            hasClass : function(element, cls) {
                var re = new RegExp('(^| )' + cls + '( |$)');
                return re.test(element.className);
            },
            getByClass : function(element, cls) {
                if (isDefined(element.querySelectorAll)) {
                    return element.querySelectorAll('.' + cls);
                }
                var result = [];
                var candidates = element.getElementsByTagName("*");
                forEach(candidates, function(element) {
                    if (JKinematics.Adapter.hasClass(element, cls)) {
                        result.push(element);
                    }
                });
                return result;
            },
            addEltClass : function(target, cls) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    if (!JKinematics.Adapter.hasClass(element, cls)) {
                        element.className += ' ' + cls;
                        return true;
                    }
                }
                return false;
            },
            removeEltClass : function(target, cls) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    var re = new RegExp('(^| )' + cls + '( |$)');
                    element.className = element.className.replace(re, ' ')
                            .replace(/^\s+|\s+$/g, "");
                    return true;
                }
                return false;
            },
            prependElt : function(target, content) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    element.insertBefore(content, element.firstChild);
                    return true;
                }
                return false;
            },
            appendElt : function(target, content) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    element.appendChild(content);
                    return true;
                }
                return false;
            },
            hideElt : function(target) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    element.style.display = "none";
                    return true;
                }
                return false;
            },
            showElt : function(target) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    element.style.display = "block";
                    return true;
                }
                return false;
            },
            emptyElt : function(target) {
                var element = document.getElementById(target);
                if (isDefined(element)) {
                    while (element.firstChild) {
                        element.removeChild(element.firstChild);
                    }
                    return true;
                }
                return false;
            },
            replaceElt : function(target, content) {
                return JKinematics.Adapter.emptyElt(target)
                        && JKinematics.Adapter.appendElt(target, content);
            },
            attach : function(element, type, fn, capture) {
                if (isDefined(element.addEventListener)) {
                    element.addEventListener(type, fn,
                            capture != undefined ? capture : false);
                } else if (isDefined(element.attachEvent)) {
                    element.attachEvent('on' + type, fn);
                }
            },
            detach : function(element, type, fn, capture) {
                if (isDefined(element.removeEventListener)) {
                    element.removeEventListener(type, fn,
                            capture != undefined ? capture : false);
                } else if (isDefined(element.detachEvent)) {
                    element.detachEvent('on' + type, fn);
                }
            }
        };
    }

})(window);
