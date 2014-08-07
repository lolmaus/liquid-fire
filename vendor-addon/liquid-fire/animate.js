/* global $ */
import Promise from "./promise";

// Make sure Velocity always has promise support by injecting our own
// RSVP-based implementation if it doesn't already have one.
if (!$.Velocity.Promise) {
  $.Velocity.Promise = Promise;
}

export function animate(view, props, opts, label) {
  // These numbers are just sane defaults in the probably-impossible
  // case where somebody tries to read our state before the first
  // 'progress' callback has fired.
  var state = { percentComplete: 0, timeRemaining: 100, timeSpent: 0 },
      elt;

  if (!view || !(elt = view.$()) || !elt[0]) {
    return Promise.cast();
  }

  if (!opts) {  opts = {}; }

  // By default, we ask velocity to reveal the elements at the start
  // of animation. Our animated divs are all initially rendered at
  // display:none to prevent a flash of before-animated content.
  //
  // At present, velocity's 'auto' just picks a value for the css
  // display property based on the element type. I have a PR that
  // would let it defer to the stylesheets instead.
  if (typeof(opts.display) === 'undefined') {
    opts.display = 'auto';
  }

  opts.progress = function(){
    state.percentComplete = arguments[1];
    state.timeRemaining = arguments[2];
    state.timeSpent = state.timeRemaining / (1/state.percentComplete - 1);
  };

  state.promise = $.Velocity.animate(elt[0], props, opts);

  if (label) {
    state.promise = state.promise.then(function(){
      clearLabel(view, label);
    }, function(err) {
      clearLabel(view, label);
      throw err;
    });
    applyLabel(view, label, state);
  }

  return state.promise;
}

export function stop(view) {
  var elt;
  if (view && (elt = view.$())) {
    elt.velocity('stop', true);
  }
}

export function setDefaults(props) {
  for (var key in props) {
    if (props.hasOwnProperty(key)) {
      $.Velocity.defaults[key] = props[key];
    }
  }
}

export function isAnimating(view, animationLabel) {
  return view && view._lfTags && view._lfTags[animationLabel];
}

function stateForLabel(view, label) {
  var state = isAnimating(view, label);
  if (!state) {
    throw new Error("no animation labeled " + label + " is in progress");
  }
  return state;
}

export function finish(view, animationLabel) {
  return stateForLabel(view, animationLabel).promise;
}

export function timeSpent(view, animationLabel) {
  return stateForLabel(view, animationLabel).timeSpent;
}

export function timeRemaining(view, animationLabel) {
  return stateForLabel(view, animationLabel).timeRemaining;
}

function applyLabel(view, label, state) {
  if (!view){ return; }
  if (!view._lfTags) {
    view._lfTags = {};
  }
  view._lfTags[label] = state;
}

function clearLabel(view, label) {
  if (view && view._lfTags) {
    delete view._lfTags[label];
  }
}